package com.fantasy.domain.transfer;

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

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.security.SecureRandom;

@Service
public class DraftService {
    private static final ZoneId LEAGUE_TIME_ZONE = ZoneId.of("Asia/Jerusalem");
    private final UserGameDataRepository gameDataRepo;
    private final TransferMarketService marketService;
    private final GameWeekService gameWeekService;
    private final DraftConfigRepository draftConfigRepo;
    private final LeagueRepository leagueRepo;
    private final LeagueAccessService leagueAccessService;
    private final UserSquadRepository squadRepo;
    private final SecureRandom secureRandom = new SecureRandom();

    public DraftService(UserGameDataRepository gameDataRepo, TransferMarketService marketService,
                        GameWeekService gameWeekService, DraftConfigRepository draftConfigRepo,
                        LeagueRepository leagueRepo, LeagueAccessService leagueAccessService,
                        UserSquadRepository squadRepo) {
        this.gameDataRepo = gameDataRepo;
        this.marketService = marketService;
        this.gameWeekService = gameWeekService;
        this.draftConfigRepo = draftConfigRepo;
        this.leagueRepo = leagueRepo;
        this.leagueAccessService = leagueAccessService;
        this.squadRepo = squadRepo;
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
        if (league.getStatus() == LeagueStatus.DRAFT_LIVE || league.getStatus() == LeagueStatus.ACTIVE) {
            throw new IllegalStateException("A live or completed initial draft cannot be cancelled");
        }
        draftConfigRepo.findByLeague_Id(leagueId).ifPresent(config -> {
            config.setScheduledTime(null);
            config.setProcessed(true);
            draftConfigRepo.save(config);
        });
        league.setStatus(LeagueStatus.WAITING_FOR_DRAFT);
        leagueRepo.save(league);
    }

    @Transactional
    public void scheduleDraft(int actingUserId, LocalDateTime time) {
        scheduleDraftForLeague(requireLeagueAdmin(actingUserId), time);
    }

    @Transactional
    public void scheduleDraftForLeague(long leagueId, LocalDateTime time) {
        if (time == null || !time.isAfter(LocalDateTime.now(LEAGUE_TIME_ZONE))) {
            throw new IllegalArgumentException("Draft time must be in the future");
        }
        LeagueEntity league = requireLeague(leagueId);
        if (league.getStatus() == LeagueStatus.DRAFT_LIVE || league.getStatus() == LeagueStatus.ACTIVE) {
            throw new IllegalStateException("The initial draft has already started");
        }
        DraftConfig config = draftConfigRepo.findByLeague_Id(leagueId).orElseGet(() -> {
            DraftConfig created = new DraftConfig();
            created.setLeague(league);
            return created;
        });
        config.setScheduledTime(time);
        config.setProcessed(false);
        draftConfigRepo.save(config);
        league.setStatus(LeagueStatus.DRAFT_SCHEDULED);
        leagueRepo.save(league);
    }

    @Transactional
    public void runSnakeDraft() {
        for (LeagueEntity league : leagueRepo.findAll()) {
            if (!league.getUsers().isEmpty()
                    && league.getStatus() != LeagueStatus.DRAFT_LIVE
                    && league.getStatus() != LeagueStatus.ACTIVE) {
                runSnakeDraft(league.getId());
            }
        }
    }

    @Transactional
    public void runSnakeDraftForUser(int actingUserId) {
        runSnakeDraft(requireLeagueAdmin(actingUserId));
    }

    @Transactional
    public void runSnakeDraft(long leagueId) {
        LeagueEntity league = requireLeague(leagueId);
        if (league.getStatus() == LeagueStatus.DRAFT_LIVE || league.getStatus() == LeagueStatus.ACTIVE) {
            throw new IllegalStateException("The initial draft has already started");
        }
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
        draftConfigRepo.findByLeague_Id(leagueId).ifPresent(config -> {
            config.setProcessed(true);
            draftConfigRepo.save(config);
        });
    }

    @Scheduled(cron = "0 * * * * *")
    public void checkDraftSchedule() {
        for (DraftConfig config : draftConfigRepo.findAllByProcessedFalse()) {
            if (!config.isProcessed()
                    && config.getScheduledTime() != null
                    && !LocalDateTime.now(LEAGUE_TIME_ZONE).isBefore(config.getScheduledTime())) {
                runSnakeDraft(config.getLeague().getId());
                config.setProcessed(true);
                draftConfigRepo.save(config);
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
