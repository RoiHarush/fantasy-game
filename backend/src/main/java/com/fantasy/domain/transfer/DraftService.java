package com.fantasy.domain.transfer;

import com.fantasy.config.AfterCommitExecutor;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.security.SecureRandom;

@Service
public class DraftService {
    private static final Logger log = LoggerFactory.getLogger(DraftService.class);
    private static final ZoneId LEAGUE_TIME_ZONE = ZoneId.of("Asia/Jerusalem");
    private final UserGameDataRepository gameDataRepo;
    private final TransferMarketService marketService;
    private final GameWeekService gameWeekService;
    private final DraftConfigRepository draftConfigRepo;
    private final LeagueRepository leagueRepo;
    private final LeagueAccessService leagueAccessService;
    private final UserSquadRepository squadRepo;
    private final TransferWebSocketController webSocketController;
    private final SupplementalDraftPoolService supplementalDraftPoolService;
    private final SecureRandom secureRandom = new SecureRandom();

    public DraftService(UserGameDataRepository gameDataRepo, TransferMarketService marketService,
                        GameWeekService gameWeekService, DraftConfigRepository draftConfigRepo,
                        LeagueRepository leagueRepo, LeagueAccessService leagueAccessService,
                        UserSquadRepository squadRepo,
                        TransferWebSocketController webSocketController,
                        SupplementalDraftPoolService supplementalDraftPoolService) {
        this.gameDataRepo = gameDataRepo;
        this.marketService = marketService;
        this.gameWeekService = gameWeekService;
        this.draftConfigRepo = draftConfigRepo;
        this.leagueRepo = leagueRepo;
        this.leagueAccessService = leagueAccessService;
        this.squadRepo = squadRepo;
        this.webSocketController = webSocketController;
        this.supplementalDraftPoolService = supplementalDraftPoolService;
    }

    public DraftConfig getDraftConfig(int requestingUserId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(requestingUserId);
        return getDraftConfigForLeague(leagueId);
    }

    public DraftConfig getDraftConfigForLeague(long leagueId) {
        requireLeague(leagueId);
        return draftConfigRepo.findByLeague_Id(leagueId).orElse(null);
    }

    @Transactional
    public void deleteDraftConfig(int actingUserId) {
        deleteDraftConfigForLeague(requireLeagueAdmin(actingUserId));
    }

    @Transactional
    public void deleteDraftConfigForLeague(long leagueId) {
        LeagueEntity league = requireLeague(leagueId);
        if (league.getStatus() == LeagueStatus.DRAFT_LIVE) {
            throw new IllegalStateException("A live draft cannot be cancelled");
        }
        DraftConfig existingConfig = draftConfigRepo.findByLeague_Id(leagueId).orElse(null);
        DraftType cancelledType = existingConfig == null
                ? (league.getStatus() == LeagueStatus.ACTIVE ? DraftType.SUPPLEMENTAL : DraftType.INITIAL)
                : existingConfig.getDraftType();
        Optional.ofNullable(existingConfig).ifPresent(config -> {
            config.setScheduledTime(null);
            config.setProcessed(true);
            draftConfigRepo.save(config);
        });
        if (league.getStatus() == LeagueStatus.DRAFT_SCHEDULED) {
            league.setStatus(LeagueStatus.WAITING_FOR_DRAFT);
            leagueRepo.save(league);
        }
        AfterCommitExecutor.run(() -> webSocketController.sendDraftCancelledEvent(leagueId, cancelledType));
    }

    @Transactional
    public void scheduleDraft(int actingUserId, LocalDateTime time) {
        scheduleDraftForLeague(
                requireLeagueAdmin(actingUserId),
                time,
                DraftOrderSource.TRANSFER_ORDER,
                List.of()
        );
    }

    @Transactional
    public void scheduleDraftForLeague(long leagueId, LocalDateTime time) {
        scheduleDraftForLeague(leagueId, time, DraftOrderSource.TRANSFER_ORDER, List.of());
    }

    @Transactional
    public void scheduleDraft(int actingUserId,
                              LocalDateTime time,
                              DraftOrderSource orderSource,
                              List<Integer> manualOrder) {
        scheduleDraftForLeague(requireLeagueAdmin(actingUserId), time, orderSource, manualOrder);
    }

    @Transactional
    public void scheduleDraftForLeague(long leagueId,
                                       LocalDateTime time,
                                       DraftOrderSource requestedOrderSource,
                                       List<Integer> requestedManualOrder) {
        if (time == null || !time.isAfter(LocalDateTime.now(LEAGUE_TIME_ZONE))) {
            throw new IllegalArgumentException("Draft time must be in the future");
        }
        LeagueEntity league = requireLeague(leagueId);
        if (league.getStatus() == LeagueStatus.DRAFT_LIVE) {
            throw new IllegalStateException("A draft is already live");
        }
        DraftType draftType = league.getStatus() == LeagueStatus.ACTIVE
                ? DraftType.SUPPLEMENTAL
                : DraftType.INITIAL;
        DraftOrderSource orderSource = requestedOrderSource == null
                ? DraftOrderSource.TRANSFER_ORDER
                : requestedOrderSource;
        List<Integer> manualOrder = requestedManualOrder == null
                ? List.of()
                : List.copyOf(requestedManualOrder);
        if (draftType == DraftType.SUPPLEMENTAL) {
            requireSupplementalPool(leagueId);
            if (orderSource == DraftOrderSource.MANUAL) {
                validateTwoRoundOrder(league, manualOrder);
            }
        }
        DraftConfig config = draftConfigRepo.findByLeague_Id(leagueId).orElseGet(() -> {
            DraftConfig created = new DraftConfig();
            created.setLeague(league);
            return created;
        });
        config.setScheduledTime(time);
        config.setProcessed(false);
        config.setDraftType(draftType);
        config.setOrderSource(orderSource);
        config.setManualOrder(orderSource == DraftOrderSource.MANUAL ? manualOrder : List.of());
        draftConfigRepo.save(config);
        if (draftType == DraftType.INITIAL) {
            league.setStatus(LeagueStatus.DRAFT_SCHEDULED);
            leagueRepo.save(league);
        }
        AfterCommitExecutor.run(() -> webSocketController.sendDraftScheduledEvent(leagueId, time, draftType));
    }

    @Transactional
    public void runSnakeDraft() {
        for (LeagueEntity league : leagueRepo.findAll()) {
            if (!league.getUsers().isEmpty()
                    && league.getStatus() != LeagueStatus.ACTIVE
                    && league.getStatus() != LeagueStatus.DRAFT_LIVE) {
                runSnakeDraft(league.getId());
            }
        }
    }

    @Transactional
    public void runSnakeDraftForUser(int actingUserId) {
        runSnakeDraft(requireLeagueAdmin(actingUserId));
    }

    @Transactional
    public void runDraftForUser(int actingUserId,
                                DraftOrderSource orderSource,
                                List<Integer> manualOrder) {
        long leagueId = requireLeagueAdmin(actingUserId);
        configureImmediateDraft(leagueId, orderSource, manualOrder);
        runSnakeDraft(leagueId);
    }

    @Transactional
    public void runSnakeDraft(long leagueId) {
        LeagueEntity league = leagueRepo.findByIdWithLock(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        if (league.getStatus() == LeagueStatus.DRAFT_LIVE) {
            throw new IllegalStateException("A draft is already live");
        }
        DraftType draftType = league.getStatus() == LeagueStatus.ACTIVE
                ? DraftType.SUPPLEMENTAL
                : DraftType.INITIAL;
        DraftConfig config = draftConfigRepo.findByLeague_Id(leagueId).orElse(null);
        if (draftType == DraftType.SUPPLEMENTAL) {
            openSupplementalDraft(league, config);
            markProcessed(config);
            return;
        }

        openInitialDraft(league);
        markProcessed(config);
    }

    private void openInitialDraft(LeagueEntity league) {
        long leagueId = league.getId();
        List<UserGameDataEntity> managers = gameDataRepo.findByLeague_Id(leagueId).stream()
                .filter(data -> data.getUser() != null)
                .toList();
        if (managers.size() != league.getMaxParticipants()) {
            throw new IllegalStateException(
                    "All " + league.getMaxParticipants() + " managers must join before the initial draft"
            );
        }
        var nextGameweek = gameWeekService.getNextGameweek();
        if (nextGameweek == null) {
            throw new IllegalStateException("No upcoming gameweek is available for the initial draft");
        }
        int nextGwId = nextGameweek.getId();
        prepareInitialSquads(managers, nextGwId);
        List<Integer> baseOrder = managers.stream().map(data -> data.getUser().getId()).collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        Collections.shuffle(baseOrder, secureRandom);
        List<Integer> snakeOrder = buildInitialSnakeOrder(baseOrder, managers);

        league.setStatus(LeagueStatus.DRAFT_LIVE);
        leagueRepo.save(league);
        marketService.openDraftWindow(leagueId, nextGwId, snakeOrder);
    }

    private void openSupplementalDraft(LeagueEntity league, DraftConfig config) {
        long leagueId = league.getId();
        requireSupplementalPool(leagueId);
        var nextGameweek = gameWeekService.getNextGameweek();
        if (nextGameweek == null) {
            throw new IllegalStateException("No upcoming gameweek is available for the supplemental draft");
        }

        DraftOrderSource orderSource = config == null || config.getOrderSource() == null
                ? DraftOrderSource.TRANSFER_ORDER
                : config.getOrderSource();
        List<Integer> order = orderSource == DraftOrderSource.MANUAL
                ? new ArrayList<>(config.getManualOrder())
                : marketService.getConfiguredTransferOrderForLeague(leagueId, nextGameweek.getId());
        validateTwoRoundOrder(league, order);
        marketService.openSupplementalDraftWindow(leagueId, nextGameweek.getId(), order);
    }

    private void configureImmediateDraft(long leagueId,
                                         DraftOrderSource requestedOrderSource,
                                         List<Integer> requestedManualOrder) {
        LeagueEntity league = requireLeague(leagueId);
        DraftType draftType = league.getStatus() == LeagueStatus.ACTIVE
                ? DraftType.SUPPLEMENTAL
                : DraftType.INITIAL;
        DraftOrderSource orderSource = requestedOrderSource == null
                ? DraftOrderSource.TRANSFER_ORDER
                : requestedOrderSource;
        List<Integer> manualOrder = requestedManualOrder == null
                ? List.of()
                : List.copyOf(requestedManualOrder);
        if (draftType == DraftType.SUPPLEMENTAL) {
            requireSupplementalPool(leagueId);
            if (orderSource == DraftOrderSource.MANUAL) {
                validateTwoRoundOrder(league, manualOrder);
            }
        }

        DraftConfig config = draftConfigRepo.findByLeague_Id(leagueId).orElseGet(() -> {
            DraftConfig created = new DraftConfig();
            created.setLeague(league);
            return created;
        });
        config.setScheduledTime(null);
        config.setProcessed(false);
        config.setDraftType(draftType);
        config.setOrderSource(orderSource);
        config.setManualOrder(orderSource == DraftOrderSource.MANUAL ? manualOrder : List.of());
        draftConfigRepo.save(config);
    }

    private void markProcessed(DraftConfig config) {
        if (config == null) return;
        config.setProcessed(true);
        draftConfigRepo.save(config);
    }

    private void requireSupplementalPool(long leagueId) {
        if (supplementalDraftPoolService.playerIds(leagueId).isEmpty()) {
            throw new IllegalStateException("No newly discovered players are waiting for a supplemental draft");
        }
    }

    private void validateTwoRoundOrder(LeagueEntity league, List<Integer> order) {
        Set<Integer> leagueUserIds = league.getUsers().stream()
                .map(user -> user.getId())
                .collect(java.util.stream.Collectors.toSet());
        if (order == null || order.size() != leagueUserIds.size() * 2) {
            throw new IllegalArgumentException("Supplemental draft order must contain exactly two picks per manager");
        }
        Map<Integer, Long> counts = order.stream()
                .collect(java.util.stream.Collectors.groupingBy(id -> id, java.util.stream.Collectors.counting()));
        if (!counts.keySet().equals(leagueUserIds)
                || counts.values().stream().anyMatch(count -> count != 2)) {
            throw new IllegalArgumentException("Every league manager must appear exactly twice in the supplemental draft order");
        }
    }

    @Scheduled(fixedDelayString = "${app.draft.schedule-poll-millis:1000}")
    @Transactional
    public void checkDraftSchedule() {
        for (DraftConfig config : draftConfigRepo.findAllByProcessedFalse()) {
            if (!config.isProcessed()
                    && config.getScheduledTime() != null
                    && !LocalDateTime.now(LEAGUE_TIME_ZONE).isBefore(config.getScheduledTime())) {
                try {
                    runSnakeDraft(config.getLeague().getId());
                } catch (IllegalStateException exception) {
                    log.warn("Scheduled draft for league {} is due but cannot start yet: {}",
                            config.getLeague().getId(), exception.getMessage());
                } catch (RuntimeException exception) {
                    log.error("Scheduled draft for league {} failed",
                            config.getLeague().getId(), exception);
                }
            }
        }
    }

    private long requireLeagueAdmin(int actingUserId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(actingUserId);
        leagueAccessService.requireLeagueAdmin(actingUserId, leagueId);
        return leagueId;
    }

    private LeagueEntity requireLeague(long leagueId) {
        return leagueRepo.findById(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
    }

    private void prepareInitialSquads(List<UserGameDataEntity> managers, int gameweekId) {
        for (UserGameDataEntity manager : managers) {
            UserSquadEntity squad = manager.getNextSquad();
            if (squad == null) {
                squad = new UserSquadEntity();
                squad.setUser(manager);
                squad.setGameweek(gameweekId);
                squad.setStartingLineup(new ArrayList<>());
                squad.setBenchMap(new LinkedHashMap<>());
                squad.setFormation(new LinkedHashMap<>());
                squadRepo.save(squad);
                manager.setNextSquad(squad);
                gameDataRepo.save(manager);
            }
        }
    }

    private List<Integer> buildInitialSnakeOrder(List<Integer> baseOrder,
                                                  List<UserGameDataEntity> managers) {
        Map<Integer, Integer> projectedRosterSizes = new HashMap<>();
        for (UserGameDataEntity manager : managers) {
            projectedRosterSizes.put(manager.getUser().getId(), rosterSize(manager.getNextSquad()));
        }

        List<Integer> result = new ArrayList<>();
        int round = 0;
        while (projectedRosterSizes.values().stream().anyMatch(size -> size < 15)) {
            List<Integer> roundOrder = new ArrayList<>(baseOrder);
            if (round % 2 == 1) Collections.reverse(roundOrder);
            for (Integer userId : roundOrder) {
                int currentSize = projectedRosterSizes.getOrDefault(userId, 0);
                if (currentSize < 15) {
                    result.add(userId);
                    projectedRosterSizes.put(userId, currentSize + 1);
                }
            }
            round++;
        }
        return result;
    }

    private int rosterSize(UserSquadEntity squad) {
        if (squad == null) return 0;
        Set<Integer> ids = new HashSet<>(squad.getStartingLineup());
        squad.getBenchMap().values().stream().filter(Objects::nonNull).forEach(ids::add);
        if (squad.getIrId() != null) ids.add(squad.getIrId());
        return ids.size();
    }
}
