package com.fantasy.domain.trade;

import com.fantasy.config.AfterCommitExecutor;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.GameweekActivityPolicy;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.notification.LeagueNotificationRequestedEvent;
import com.fantasy.domain.notification.NotificationEvents;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import com.fantasy.domain.transfer.TransferWindowStatus;
import com.fantasy.domain.user.UserEntity;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.fantasy.domain.trade.TradeDtos.*;

@Service
public class TradeService {
    private static final ZoneId LEAGUE_TIME_ZONE = ZoneId.of("Asia/Jerusalem");
    private static final int MAX_ITEMS = 15;

    private final TradeOfferRepository offerRepo;
    private final LeagueRepository leagueRepo;
    private final LeagueAccessService leagueAccessService;
    private final UserGameDataRepository gameDataRepo;
    private final UserSquadRepository squadRepo;
    private final PlayerRepository playerRepo;
    private final GameWeekRepository gameWeekRepo;
    private final LeagueTransferWindowRepository windowRepo;
    private final TradeWebSocketController webSocket;
    private final ApplicationEventPublisher events;

    public TradeService(TradeOfferRepository offerRepo,
                        LeagueRepository leagueRepo,
                        LeagueAccessService leagueAccessService,
                        UserGameDataRepository gameDataRepo,
                        UserSquadRepository squadRepo,
                        PlayerRepository playerRepo,
                        GameWeekRepository gameWeekRepo,
                        LeagueTransferWindowRepository windowRepo,
                        TradeWebSocketController webSocket,
                        ApplicationEventPublisher events) {
        this.offerRepo = offerRepo;
        this.leagueRepo = leagueRepo;
        this.leagueAccessService = leagueAccessService;
        this.gameDataRepo = gameDataRepo;
        this.squadRepo = squadRepo;
        this.playerRepo = playerRepo;
        this.gameWeekRepo = gameWeekRepo;
        this.windowRepo = windowRepo;
        this.webSocket = webSocket;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public TradeContext context(int userId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(userId);
        LeagueEntity league = requireLeague(leagueId);
        String blockedReason = blockedReason(league);
        List<UserGameDataEntity> data = gameDataRepo.findAllByLeagueIdWithSquads(leagueId);
        Set<Integer> playerIds = data.stream()
                .map(UserGameDataEntity::getNextSquad)
                .filter(Objects::nonNull)
                .flatMap(squad -> rosterIds(squad).stream())
                .collect(Collectors.toSet());
        Map<Integer, PlayerEntity> players = playerRepo.findAllById(playerIds).stream()
                .collect(Collectors.toMap(PlayerEntity::getId, Function.identity()));

        List<ManagerOption> managers = data.stream()
                .filter(item -> item.getUser() != null && item.getNextSquad() != null)
                .map(item -> managerOption(item, league, players))
                .sorted(Comparator.comparing(ManagerOption::teamName, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new TradeContext(leagueId, userId, blockedReason == null, blockedReason, managers);
    }

    @Transactional(readOnly = true)
    public TradeOffers offers(int userId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(userId);
        List<TradeOffer> incoming = new ArrayList<>();
        List<TradeOffer> outgoing = new ArrayList<>();
        for (TradeOfferEntity offer : offerRepo.findVisibleOffers(leagueId, userId)) {
            TradeOffer dto = toDto(offer, userId);
            if (offer.getRecipient().getId() == userId) incoming.add(dto);
            if (offer.getProposer().getId() == userId) outgoing.add(dto);
        }
        return new TradeOffers(incoming, outgoing);
    }

    @Transactional
    public TradeOffer create(int proposerId, CreateTradeOfferRequest request) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("Add at least one player swap");
        }
        if (request.items().size() > MAX_ITEMS) {
            throw new IllegalArgumentException("A trade can contain at most " + MAX_ITEMS + " swaps");
        }
        if (request.recipientUserId() == proposerId) {
            throw new IllegalArgumentException("You cannot trade with yourself");
        }

        long leagueId = leagueAccessService.requireLeagueIdForUser(proposerId);
        LeagueEntity league = leagueRepo.findByIdWithLock(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        requireAvailable(league);
        leagueAccessService.requireSameLeague(proposerId, request.recipientUserId());

        Map<Integer, UserGameDataEntity> data = leagueDataByUser(leagueId, false);
        UserGameDataEntity proposerData = requireGameData(data, proposerId);
        UserGameDataEntity recipientData = requireGameData(data, request.recipientUserId());
        validateItems(league, proposerData.getNextSquad(), recipientData.getNextSquad(), request.items());

        TradeOfferEntity offer = new TradeOfferEntity();
        offer.setLeague(league);
        offer.setProposer(proposerData.getUser());
        offer.setRecipient(recipientData.getUser());
        offer.setMessage(normalizeMessage(request.message()));
        for (CreateTradeItemRequest requested : request.items()) {
            TradeOfferItemEntity item = new TradeOfferItemEntity();
            item.setProposerPlayer(playerRepo.getReferenceById(requested.offeredPlayerId()));
            item.setRecipientPlayer(playerRepo.getReferenceById(requested.requestedPlayerId()));
            offer.addItem(item);
        }
        TradeOfferEntity saved = offerRepo.saveAndFlush(offer);
        publishChange(saved);
        publishUserNotification(leagueId, request.recipientUserId(),
                NotificationEvents.tradeOffered(saved.getId(), managerName(proposerData)));
        return toDto(saved, proposerId);
    }

    @Transactional
    public TradeOffer accept(int recipientId, long offerId) {
        TradeOfferEntity initial = offerRepo.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Trade offer was not found"));
        long leagueId = initial.getLeague().getId();
        LeagueEntity league = leagueRepo.findByIdWithLock(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        TradeOfferEntity offer = offerRepo.findByIdForUpdate(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Trade offer was not found"));
        requireRecipient(offer, recipientId);
        requirePending(offer);
        requireAvailable(league);

        Map<Integer, UserGameDataEntity> data = leagueDataByUser(leagueId, true);
        UserGameDataEntity proposerData = requireGameData(data, offer.getProposer().getId());
        UserGameDataEntity recipientData = requireGameData(data, recipientId);
        Map<Integer, Long> proposerClubCountsBefore = clubCounts(proposerData.getNextSquad());
        Map<Integer, Long> recipientClubCountsBefore = clubCounts(recipientData.getNextSquad());
        List<CreateTradeItemRequest> items = offer.getItems().stream()
                .map(item -> new CreateTradeItemRequest(
                        item.getProposerPlayer().getId(), item.getRecipientPlayer().getId()))
                .toList();
        validateItems(league, proposerData.getNextSquad(), recipientData.getNextSquad(), items);

        for (CreateTradeItemRequest item : items) {
            replacePlayer(proposerData, item.offeredPlayerId(), item.requestedPlayerId());
            replacePlayer(recipientData, item.requestedPlayerId(), item.offeredPlayerId());
        }
        validateFinalSquad(proposerData.getNextSquad());
        validateFinalSquad(recipientData.getNextSquad());
        validateClubLimit(proposerData.getNextSquad(), proposerClubCountsBefore);
        validateClubLimit(recipientData.getNextSquad(), recipientClubCountsBefore);
        squadRepo.save(proposerData.getNextSquad());
        squadRepo.save(recipientData.getNextSquad());
        gameDataRepo.save(proposerData);
        gameDataRepo.save(recipientData);

        offer.finish(TradeOfferStatus.ACCEPTED);
        invalidateCompetingOffers(leagueId, offer, movedPlayerIds(items));
        offerRepo.flush();
        publishChange(offer);
        publishUserNotification(leagueId, offer.getProposer().getId(),
                NotificationEvents.tradeAccepted(offer.getId(), managerName(recipientData)));
        return toDto(offer, recipientId);
    }

    @Transactional
    public TradeOffer reject(int recipientId, long offerId) {
        TradeOfferEntity offer = offerRepo.findByIdForUpdate(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Trade offer was not found"));
        requireRecipient(offer, recipientId);
        requirePending(offer);
        offer.finish(TradeOfferStatus.REJECTED);
        publishChange(offer);
        publishUserNotification(offer.getLeague().getId(), offer.getProposer().getId(),
                NotificationEvents.tradeRejected(offer.getId(), offer.getRecipient().getName()));
        return toDto(offer, recipientId);
    }

    @Transactional
    public TradeOffer cancel(int proposerId, long offerId) {
        TradeOfferEntity offer = offerRepo.findByIdForUpdate(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Trade offer was not found"));
        if (offer.getProposer().getId() != proposerId) {
            throw new AccessDeniedException("Only the proposer can cancel this trade");
        }
        requirePending(offer);
        offer.finish(TradeOfferStatus.CANCELLED);
        publishChange(offer);
        return toDto(offer, proposerId);
    }

    private void validateItems(LeagueEntity league,
                               UserSquadEntity proposerSquad,
                               UserSquadEntity recipientSquad,
                               List<CreateTradeItemRequest> items) {
        if (proposerSquad == null || recipientSquad == null) {
            throw new IllegalStateException("Both managers must have an active squad");
        }
        Set<Integer> seen = new HashSet<>();
        for (CreateTradeItemRequest item : items) {
            if (item.offeredPlayerId() == item.requestedPlayerId()
                    || !seen.add(item.offeredPlayerId()) || !seen.add(item.requestedPlayerId())) {
                throw new IllegalArgumentException("Every player can appear only once in a trade");
            }
            PlayerEntity offered = playerRepo.findById(item.offeredPlayerId())
                    .orElseThrow(() -> new IllegalArgumentException("Offered player was not found"));
            PlayerEntity requested = playerRepo.findById(item.requestedPlayerId())
                    .orElseThrow(() -> new IllegalArgumentException("Requested player was not found"));
            if (!rosterIds(proposerSquad).contains(offered.getId())) {
                throw new IllegalStateException(offered.getViewName() + " is no longer owned by the proposer");
            }
            if (!rosterIds(recipientSquad).contains(requested.getId())) {
                throw new IllegalStateException(requested.getViewName() + " is no longer owned by the recipient");
            }
            if (Objects.equals(proposerSquad.getIrId(), offered.getId())
                    || Objects.equals(recipientSquad.getIrId(), requested.getId())) {
                throw new IllegalStateException("Players in an IR slot cannot be traded");
            }
            if (league.isPlayerLocked(offered.getId()) || league.isPlayerLocked(requested.getId())) {
                throw new IllegalStateException("A locked player cannot be traded");
            }
            if (league.effectivePosition(offered) != league.effectivePosition(requested)) {
                throw new IllegalArgumentException("Every swap must contain two players in the same position");
            }
        }
    }

    private String blockedReason(LeagueEntity league) {
        if (league.getStatus() != LeagueStatus.ACTIVE) return "Trades become available after the initial draft.";
        if (windowRepo.existsByLeague_IdAndStatus(league.getId(), TransferWindowStatus.OPEN)) {
            return "Trades are paused while a transfer or draft window is open.";
        }
        return GameweekActivityPolicy.findActiveNow(gameWeekRepo.findAll(), LocalDateTime.now(LEAGUE_TIME_ZONE))
                .map(gameweek -> "Trades are paused while " + (gameweek.getName() == null
                        ? "Gameweek " + gameweek.getId() : gameweek.getName()) + " is active.")
                .orElse(null);
    }

    private void requireAvailable(LeagueEntity league) {
        String reason = blockedReason(league);
        if (reason != null) throw new IllegalStateException(reason);
    }

    private Map<Integer, UserGameDataEntity> leagueDataByUser(long leagueId, boolean locked) {
        List<UserGameDataEntity> rows = locked
                ? gameDataRepo.findAllByLeagueIdForUpdate(leagueId)
                : gameDataRepo.findAllByLeagueIdWithSquads(leagueId);
        rows.forEach(row -> {
            if (row.getNextSquad() != null) {
                row.getNextSquad().getStartingLineup().size();
                row.getNextSquad().getBenchMap().size();
            }
        });
        return rows.stream().filter(row -> row.getUser() != null)
                .collect(Collectors.toMap(row -> row.getUser().getId(), Function.identity()));
    }

    private UserGameDataEntity requireGameData(Map<Integer, UserGameDataEntity> data, int userId) {
        UserGameDataEntity result = data.get(userId);
        if (result == null || result.getNextSquad() == null) {
            throw new IllegalStateException("Manager does not have an active squad");
        }
        return result;
    }

    private void replacePlayer(UserGameDataEntity data, int outgoingId, int incomingId) {
        UserSquadEntity squad = data.getNextSquad();
        List<Integer> lineup = new ArrayList<>(squad.getStartingLineup());
        int index = lineup.indexOf(outgoingId);
        if (index >= 0) {
            lineup.set(index, incomingId);
            squad.setStartingLineup(lineup);
        } else {
            Map<String, Integer> bench = new LinkedHashMap<>(squad.getBenchMap());
            String slot = bench.entrySet().stream()
                    .filter(entry -> Objects.equals(entry.getValue(), outgoingId))
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("A traded player is no longer in the squad"));
            bench.put(slot, incomingId);
            squad.setBenchMap(bench);
        }

        boolean forfeitsFirstPick = Objects.equals(squad.getFirstPickId(), outgoingId)
                && Boolean.TRUE.equals(data.getActiveChips().get("FIRST_PICK_CAPTAIN"));
        if (forfeitsFirstPick) {
            data.getActiveChips().put("FIRST_PICK_CAPTAIN", false);
            data.getChips().put("FIRST_PICK_CAPTAIN", 0);
            squad.setFirstPickId(null);
            assignCaptain(squad);
        } else if (Objects.equals(squad.getCaptainId(), outgoingId)) {
            squad.setCaptainId(incomingId);
        }
        if (Objects.equals(squad.getViceCaptainId(), outgoingId)) squad.setViceCaptainId(incomingId);
        if (!forfeitsFirstPick && Objects.equals(squad.getFirstPickId(), outgoingId)) squad.setFirstPickId(null);
    }

    private void assignCaptain(UserSquadEntity squad) {
        List<Integer> candidates = squad.getStartingLineup();
        if (candidates.isEmpty()) return;
        squad.setCaptainId(candidates.getFirst());
        squad.setViceCaptainId(candidates.size() > 1 ? candidates.get(1) : candidates.getFirst());
    }

    private void validateFinalSquad(UserSquadEntity squad) {
        Set<Integer> roster = rosterIds(squad);
        int rawSize = squad.getStartingLineup().size()
                + (int) squad.getBenchMap().values().stream().filter(Objects::nonNull).count();
        if (roster.size() != rawSize || roster.size() != 15) {
            throw new IllegalStateException("Trade would create an invalid squad");
        }
    }

    private Map<Integer, Long> clubCounts(UserSquadEntity squad) {
        return playerRepo.findAllById(rosterIds(squad)).stream()
                .filter(player -> player.getTeamId() != null)
                .collect(Collectors.groupingBy(PlayerEntity::getTeamId, Collectors.counting()));
    }

    private void validateClubLimit(UserSquadEntity squad, Map<Integer, Long> countsBefore) {
        Map<Integer, Long> countsAfter = clubCounts(squad);
        boolean increasedOverage = countsAfter.entrySet().stream().anyMatch(entry -> (
                entry.getValue() > 3
                        && entry.getValue() > countsBefore.getOrDefault(entry.getKey(), 0L)
        ));
        if (increasedOverage) {
            throw new IllegalStateException("Trade would create more than 3 players from the same club");
        }
    }

    private void invalidateCompetingOffers(long leagueId,
                                            TradeOfferEntity accepted,
                                            Set<Integer> movedPlayers) {
        for (TradeOfferEntity candidate : offerRepo.findPendingByLeagueForUpdate(leagueId, TradeOfferStatus.PENDING)) {
            if (candidate.getId().equals(accepted.getId())) continue;
            boolean overlaps = candidate.getItems().stream().anyMatch(item ->
                    movedPlayers.contains(item.getProposerPlayer().getId())
                            || movedPlayers.contains(item.getRecipientPlayer().getId()));
            if (overlaps) {
                candidate.finish(TradeOfferStatus.INVALIDATED);
                publishChange(candidate);
            }
        }
    }

    private Set<Integer> movedPlayerIds(List<CreateTradeItemRequest> items) {
        Set<Integer> ids = new HashSet<>();
        items.forEach(item -> { ids.add(item.offeredPlayerId()); ids.add(item.requestedPlayerId()); });
        return ids;
    }

    private ManagerOption managerOption(UserGameDataEntity data,
                                        LeagueEntity league,
                                        Map<Integer, PlayerEntity> players) {
        List<PlayerOption> options = rosterIds(data.getNextSquad()).stream()
                .map(players::get).filter(Objects::nonNull)
                .filter(player -> !Objects.equals(data.getNextSquad().getIrId(), player.getId()))
                .filter(player -> !league.isPlayerLocked(player.getId()))
                .map(player -> playerOption(player, league))
                .sorted(Comparator.comparing(PlayerOption::position)
                        .thenComparing(PlayerOption::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new ManagerOption(data.getUser().getId(), data.getUser().getFullName(),
                teamName(data), data.getTeamLogoVersion(), options);
    }

    private TradeOffer toDto(TradeOfferEntity offer, int userId) {
        boolean pending = offer.getStatus() == TradeOfferStatus.PENDING;
        return new TradeOffer(offer.getId(), offer.getStatus().name(),
                managerSummary(offer.getProposer()), managerSummary(offer.getRecipient()),
                offer.getItems().stream().map(item -> new TradeItem(
                        playerOption(item.getProposerPlayer(), offer.getLeague()),
                        playerOption(item.getRecipientPlayer(), offer.getLeague()))).toList(),
                offer.getMessage(), offer.getCreatedAt(), offer.getRespondedAt(),
                pending && offer.getRecipient().getId() == userId,
                pending && offer.getRecipient().getId() == userId,
                pending && offer.getProposer().getId() == userId);
    }

    private ManagerSummary managerSummary(UserEntity user) {
        return gameDataRepo.findByUserId(user.getId())
                .map(data -> new ManagerSummary(user.getId(), user.getFullName(), teamName(data), data.getTeamLogoVersion()))
                .orElseGet(() -> new ManagerSummary(user.getId(), user.getFullName(), user.getName(), 0));
    }

    private PlayerOption playerOption(PlayerEntity player, LeagueEntity league) {
        return new PlayerOption(player.getId(), displayName(player),
                league.effectivePosition(player).getCode(), player.getTeamId(), player.getPhoto());
    }

    private Set<Integer> rosterIds(UserSquadEntity squad) {
        Set<Integer> ids = new LinkedHashSet<>(squad.getStartingLineup());
        squad.getBenchMap().values().stream().filter(Objects::nonNull).forEach(ids::add);
        return ids;
    }

    private LeagueEntity requireLeague(long leagueId) {
        return leagueRepo.findById(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
    }

    private void requirePending(TradeOfferEntity offer) {
        if (offer.getStatus() != TradeOfferStatus.PENDING) {
            throw new IllegalStateException("This trade offer is no longer pending");
        }
    }

    private void requireRecipient(TradeOfferEntity offer, int userId) {
        if (offer.getRecipient().getId() != userId) {
            throw new AccessDeniedException("Only the recipient can respond to this trade");
        }
    }

    private String normalizeMessage(String message) {
        if (message == null || message.isBlank()) return null;
        String normalized = message.trim();
        if (normalized.length() > 500) throw new IllegalArgumentException("Message is too long");
        return normalized;
    }

    private String displayName(PlayerEntity player) {
        if (player.getViewName() != null && !player.getViewName().isBlank()) return player.getViewName();
        return ((player.getFirstName() == null ? "" : player.getFirstName()) + " "
                + (player.getLastName() == null ? "" : player.getLastName())).trim();
    }

    private String teamName(UserGameDataEntity data) {
        return data.getFantasyTeamName() == null || data.getFantasyTeamName().isBlank()
                ? data.getUser().getName() : data.getFantasyTeamName();
    }

    private String managerName(UserGameDataEntity data) { return data.getUser().getFullName(); }

    private void publishChange(TradeOfferEntity offer) {
        long leagueId = offer.getLeague().getId();
        long offerId = offer.getId();
        String status = offer.getStatus().name();
        AfterCommitExecutor.run(() -> webSocket.sendChanged(leagueId, offerId, status));
    }

    private void publishUserNotification(long leagueId,
                                         int userId,
                                         com.fantasy.domain.notification.NotificationEvent notification) {
        AfterCommitExecutor.run(() -> events.publishEvent(
                LeagueNotificationRequestedEvent.user(leagueId, userId, notification)));
    }
}
