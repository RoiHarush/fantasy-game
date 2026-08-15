package com.fantasy.domain.transfer;

import com.fantasy.config.AfterCommitExecutor;
import com.fantasy.config.WebSocketPresenceService;
import com.fantasy.scheduler.LifecycleScheduleChangedEvent;
import com.fantasy.scheduler.TransferTurnChangedEvent;
import com.fantasy.domain.game.GameweekActivityPolicy;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.notification.LeagueNotificationRequestedEvent;
import com.fantasy.domain.notification.NotificationEvents;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.team.IRSignRequestDto;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class TransferMarketService {

    private static final Logger log = LoggerFactory.getLogger(TransferMarketService.class);
    private static final ZoneId LEAGUE_TIME_ZONE = ZoneId.of("Asia/Jerusalem");

    private final PlayerRepository playerRepo;
    private final GameWeekRepository gameWeekRepo;
    private final UserSquadRepository squadRepo;
    private final UserGameDataRepository gameDataRepo;
    private final UserRepository userRepo;
    private final LeagueRepository leagueRepo;
    private final LeagueAccessService leagueAccessService;
    private final LeagueTransferWindowRepository windowRepo;
    private final WaiverPreferenceRepository waiverPreferenceRepo;
    private final WaiverPlanProgressRepository waiverProgressRepo;
    private final LeagueTransferActionRepository transferActionRepo;
    private final TransferWebSocketController webSocketController;
    private final SupplementalDraftPoolService supplementalDraftPoolService;
    private final WebSocketPresenceService presenceService;
    private ApplicationEventPublisher lifecycleEvents = event -> { };

    public TransferMarketService(PlayerRepository playerRepo,
                                 GameWeekRepository gameWeekRepo,
                                 UserSquadRepository squadRepo,
                                 UserGameDataRepository gameDataRepo,
                                 UserRepository userRepo,
                                 LeagueRepository leagueRepo,
                                 LeagueAccessService leagueAccessService,
                                 LeagueTransferWindowRepository windowRepo,
                                 WaiverPreferenceRepository waiverPreferenceRepo,
                                 WaiverPlanProgressRepository waiverProgressRepo,
                                 LeagueTransferActionRepository transferActionRepo,
                                 TransferWebSocketController webSocketController,
                                 SupplementalDraftPoolService supplementalDraftPoolService,
                                 WebSocketPresenceService presenceService) {
        this.playerRepo = playerRepo;
        this.gameWeekRepo = gameWeekRepo;
        this.squadRepo = squadRepo;
        this.gameDataRepo = gameDataRepo;
        this.userRepo = userRepo;
        this.leagueRepo = leagueRepo;
        this.leagueAccessService = leagueAccessService;
        this.windowRepo = windowRepo;
        this.waiverPreferenceRepo = waiverPreferenceRepo;
        this.waiverProgressRepo = waiverProgressRepo;
        this.transferActionRepo = transferActionRepo;
        this.webSocketController = webSocketController;
        this.supplementalDraftPoolService = supplementalDraftPoolService;
        this.presenceService = presenceService;
    }

    @Autowired
    void setLifecycleEvents(ApplicationEventPublisher lifecycleEvents) {
        this.lifecycleEvents = lifecycleEvents;
    }

    @Transactional
    public void openTransferWindow(long leagueId, int gameWeekId) {
        openWindow(leagueId, gameWeekId, TransferWindowType.TRANSFER, null);
    }

    @Transactional
    public void openDraftWindow(long leagueId, int gameWeekId, List<Integer> draftOrder) {
        openWindow(leagueId, gameWeekId, TransferWindowType.DRAFT, draftOrder);
    }

    @Transactional
    public void openSupplementalDraftWindow(long leagueId,
                                            int gameWeekId,
                                            List<Integer> draftOrder) {
        openWindow(leagueId, gameWeekId, TransferWindowType.SUPPLEMENTAL, draftOrder);
    }

    @Transactional
    public void openTransferWindowForUser(int actingUserId, int gameWeekId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(actingUserId);
        leagueAccessService.requireLeagueAdmin(actingUserId, leagueId);
        openWindow(leagueId, gameWeekId, TransferWindowType.TRANSFER, null);
    }

    @Transactional
    public void openTransferWindowForAllLeagues(int gameWeekId) {
        for (LeagueEntity league : leagueRepo.findAll()) {
            if (league.getUsers().isEmpty() || league.getStatus() != LeagueStatus.ACTIVE) continue;
            boolean alreadyConfigured = windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                            league.getId(),
                            gameWeekId,
                            TransferWindowType.TRANSFER
                    )
                    .map(window -> window.getStatus() != TransferWindowStatus.READY)
                    .orElse(false);
            if (alreadyConfigured) continue;
            openWindow(league.getId(), gameWeekId, TransferWindowType.TRANSFER, null);
        }
    }

    private void openWindow(long leagueId,
                            int gameWeekId,
                            TransferWindowType type,
                            List<Integer> requestedOrder) {
        LeagueEntity league = leagueRepo.findByIdWithLock(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        // The gameweek opener locks this same row. Whichever transaction wins
        // completes first: either this window opens and is then finalized by
        // rollover, or rollover marks the gameweek LIVE and this request fails.
        GameWeekEntity gameWeek = gameWeekRepo.findByIdWithLock(gameWeekId)
                .orElseThrow(() -> new IllegalArgumentException("GameWeek not found: " + gameWeekId));

        GameweekActivityPolicy.requireCanOpenNow(
                gameWeekRepo.findAll(),
                LocalDateTime.now(LEAGUE_TIME_ZONE),
                type == TransferWindowType.TRANSFER ? "Transfer-window opening" : "Draft opening"
        );
        if (!"UPCOMING".equalsIgnoreCase(gameWeek.getStatus())) {
            throw new IllegalStateException("A transfer or draft window can open only for an upcoming gameweek");
        }

        if (type == TransferWindowType.TRANSFER && league.getStatus() != LeagueStatus.ACTIVE) {
            throw new IllegalStateException("Regular transfer windows are available only after the initial draft");
        }

        if (!windowRepo.findByLeagueAndStatusForUpdate(leagueId, TransferWindowStatus.OPEN).isEmpty()) {
            throw new IllegalStateException("A transfer or draft window is already open for this league");
        }

        LeagueTransferWindowEntity window = windowRepo
                .findConfiguredWindowForUpdate(leagueId, gameWeekId, type)
                .orElseGet(LeagueTransferWindowEntity::new);

        if (window.getStatus() == TransferWindowStatus.CLOSED) {
            throw new IllegalStateException("This window was already completed");
        }

        List<Integer> order = requestedOrder == null
                ? new ArrayList<>(window.getTurnOrder())
                : new ArrayList<>(requestedOrder);
        if (order.isEmpty()) {
            order = defaultOrderForLeague(league, gameWeek, type);
        }
        validateOrderBelongsToLeague(league, order, type);

        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setWindowType(type);
        window.setTurnOrder(order);
        if (window.getCanonicalOrder().isEmpty()) {
            window.setCanonicalOrder(order);
        }
        List<Integer> eligibleForIr = type == TransferWindowType.TRANSFER
                ? findUsersEligibleForIr(leagueId, window.getCanonicalOrder())
                : List.of();
        window.open(eligibleForIr);
        windowRepo.saveAndFlush(window);

        long windowLeagueId = league.getId();
        int firstUser = window.currentUserId().orElse(-1);
        List<Integer> initialOrder = window.initialOrder();
        List<Integer> canonicalOrder = new ArrayList<>(window.getCanonicalOrder());
        List<Integer> remainingOrder = window.remainingOrder();
        Map<Integer, Integer> turnsUsed = window.turnsUsed();
        Map<Integer, Integer> totalTurns = window.totalTurns();
        publishAfterCommit(() -> webSocketController.sendWindowOpenedEvent(
                windowLeagueId,
                firstUser,
                initialOrder,
                canonicalOrder,
                remainingOrder,
                turnsUsed,
                totalTurns,
                type
        ));
        publishTransferTurnChanged(windowLeagueId);
        long openedWindowId = window.getId();
        publishLeagueNotificationExcluding(
                windowLeagueId,
                window.getAutomaticUserIds(),
                openedNotification(type, openedWindowId, gameWeekId)
        );
        if (firstUser > 0 && !window.isAutomaticForUser(firstUser)) {
            publishUserNotification(
                    windowLeagueId,
                    firstUser,
                    yourTurnNotification(type, openedWindowId, window.getPhase().name(), 0)
            );
        }
        publishLifecycleChanged(type + " window opened for league " + leagueId);
        log.info("{} window opened for league {} and GW {}", type, leagueId, gameWeekId);
    }

    @Transactional
    public void passTurn(int userId) {
        LeagueTransferWindowEntity window = activeWindowForUser(userId);
        validateTurn(window, userId);
        if (window.getWindowType() == TransferWindowType.DRAFT) {
            throw new IllegalStateException("The initial draft cannot be passed; every manager must complete a squad");
        }
        if (window.getPhase() == TransferWindowPhase.IR) {
            throw new IllegalStateException("Cannot pass during the IR round");
        }

        long leagueId = window.getLeague().getId();
        String userName = getUserName(userId);
        advanceTurn(window);
        publishAfterCommit(() -> webSocketController.sendPassEvent(leagueId, userId, userName));
    }

    @Transactional
    public void skipCurrentTurn(int actingUserId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(actingUserId);
        leagueAccessService.requireLeagueAdmin(actingUserId, leagueId);

        List<LeagueTransferWindowEntity> windows = windowRepo.findByLeagueAndStatusForUpdate(
                leagueId,
                TransferWindowStatus.OPEN
        );
        if (windows.size() != 1) {
            throw new IllegalStateException("There is no active transfer window to skip");
        }

        LeagueTransferWindowEntity window = windows.getFirst();
        if (window.getWindowType() != TransferWindowType.TRANSFER) {
            throw new IllegalStateException("Draft turns cannot be skipped by the league admin");
        }
        if (isLineupDeadlineReached(window)) {
            throw new IllegalStateException("The lineup deadline has passed");
        }

        int skippedUserId = window.currentUserId()
                .orElseThrow(() -> new IllegalStateException("There is no active turn to skip"));
        if (window.getPhase() == TransferWindowPhase.IR) {
            processAutomatedIrTurn(window, skippedUserId);
        } else {
            String userName = getUserName(skippedUserId);
            publishAfterCommit(() -> webSocketController.sendPassEvent(
                    leagueId,
                    skippedUserId,
                    userName
            ));
        }
        advanceTurn(window);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAttendancePreference(int requestingUserId, int gameWeekId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(requestingUserId);
        Optional<LeagueTransferWindowEntity> configuredWindow = windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                        leagueId,
                        gameWeekId,
                        TransferWindowType.TRANSFER
                );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("gameWeekId", gameWeekId);
        response.put("automatic", configuredWindow
                .map(window -> window.isAutomaticForUser(requestingUserId))
                .orElse(false));
        response.put("automaticUserIds", configuredWindow
                .map(LeagueTransferWindowEntity::getAutomaticUserIds)
                .orElseGet(Set::of));
        response.put("windowStatus", configuredWindow
                .map(window -> window.getStatus().name())
                .orElse("NOT_CREATED"));
        return response;
    }

    @Transactional
    public Map<String, Object> setAttendancePreference(int requestingUserId,
                                                       int gameWeekId,
                                                       boolean automatic) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(requestingUserId);
        LeagueEntity league = leagueRepo.findByIdWithLock(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        GameWeekEntity gameWeek = gameWeekRepo.findById(gameWeekId)
                .orElseThrow(() -> new IllegalArgumentException("GameWeek not found: " + gameWeekId));

        LeagueTransferWindowEntity window = windowRepo
                .findConfiguredWindowForUpdate(leagueId, gameWeekId, TransferWindowType.TRANSFER)
                .orElseGet(() -> {
                    LeagueTransferWindowEntity created = new LeagueTransferWindowEntity();
                    List<Integer> order = defaultOrderForLeague(league, gameWeek, TransferWindowType.TRANSFER);
                    created.setLeague(league);
                    created.setGameWeek(gameWeek);
                    created.setWindowType(TransferWindowType.TRANSFER);
                    created.setTurnOrder(order);
                    created.setCanonicalOrder(order);
                    return created;
                });

        if (window.getStatus() != TransferWindowStatus.READY) {
            throw new IllegalStateException("Attendance can be changed only before the window opens");
        }
        window.setAutomaticForUser(requestingUserId, automatic);
        windowRepo.saveAndFlush(window);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("gameWeekId", gameWeekId);
        response.put("automatic", automatic);
        response.put("automaticUserIds", window.getAutomaticUserIds());
        response.put("windowStatus", window.getStatus().name());
        return response;
    }

    @Transactional
    public void processTransfer(TransferRequestDto request) {
        LeagueTransferWindowEntity window = activeWindowForUser(request.getUserId());
        validateTurn(window, request.getUserId());
        if (window.getWindowType() == TransferWindowType.DRAFT) {
            throw new IllegalStateException("Use the draft-pick endpoint during the initial draft");
        }
        if (window.getPhase() != TransferWindowPhase.REGULAR) {
            throw new IllegalStateException("Regular transfers are closed during the IR round");
        }

        performTransfer(
                window.getLeague().getId(),
                request.getUserId(),
                request.getPlayerOutId(),
                request.getPlayerInId(),
                window.getWindowType() == TransferWindowType.SUPPLEMENTAL
        );
        recordAction(
                window,
                request.getUserId(),
                window.getWindowType() == TransferWindowType.SUPPLEMENTAL
                        ? TransferActionSource.DRAFT
                        : TransferActionSource.MANUAL,
                request.getPlayerInId(),
                request.getPlayerOutId()
        );

        long leagueId = window.getLeague().getId();
        String userName = getUserName(request.getUserId());
        publishAfterCommit(() -> webSocketController.sendTransferDoneEvent(
                leagueId,
                request.getUserId(),
                request.getPlayerOutId(),
                request.getPlayerInId(),
                userName
        ));
        advanceTurn(window);
    }

    @Transactional
    public void processDraftPick(int userId, int playerId) {
        LeagueTransferWindowEntity window = activeWindowForUser(userId);
        validateTurn(window, userId);
        if (window.getWindowType() != TransferWindowType.DRAFT) {
            throw new IllegalStateException("The initial draft is not active");
        }

        long leagueId = window.getLeague().getId();
        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new FantasyTeamException("User game data was not found"));
        requireGameDataInLeague(gameData, leagueId);
        UserSquadEntity squad = requireNextSquad(gameData);
        LeagueEntity league = requireLeague(leagueId);
        PlayerEntity player = playerRepo.findById(playerId)
                .orElseThrow(() -> new FantasyTeamException("Player was not found"));

        if (rosterSize(squad) >= 15) {
            throw new FantasyTeamException("Your initial squad is already complete");
        }
        if (isPlayerOwnedInLeague(leagueId, playerId)) {
            throw new FantasyTeamException("Player is already owned in this league");
        }
        if (league.isPlayerLocked(playerId)) {
            throw new FantasyTeamException("Player is locked in this league");
        }

        validateDraftPositionLimit(squad, league, player);
        validateClubLimit(squad, null, player);

        List<Integer> roster = new ArrayList<>(squad.getStartingLineup());
        roster.add(playerId);
        squad.setStartingLineup(roster);
        if (squad.getFirstPickId() == null) squad.setFirstPickId(playerId);
        squadRepo.save(squad);
        recordAction(window, userId, TransferActionSource.DRAFT, playerId, null);

        String userName = getUserName(userId);
        publishAfterCommit(() -> webSocketController.sendTransferDoneEvent(
                leagueId,
                userId,
                playerId,
                userName
        ));
        advanceTurn(window);
    }

    @Transactional
    public void replaceIRPlayer(IRSignRequestDto request) {
        LeagueTransferWindowEntity window = activeWindowForUser(request.getUserId());
        validateTurn(window, request.getUserId());
        if (window.getPhase() != TransferWindowPhase.IR) {
            throw new IllegalStateException("Not IR round");
        }

        UserGameDataEntity gameData = gameDataRepo.findByUserId(request.getUserId())
                .orElseThrow(() -> new FantasyTeamException("User game data was not found"));
        Integer irPlayerId = requireNextSquad(gameData).getIrId();
        performIrReplacement(window.getLeague().getId(), request.getUserId(), request.getPlayerId());
        recordAction(window, request.getUserId(), TransferActionSource.IR_MANUAL, request.getPlayerId(), irPlayerId);

        long leagueId = window.getLeague().getId();
        String userName = getUserName(request.getUserId());
        publishAfterCommit(() -> webSocketController.sendTransferDoneEvent(
                leagueId,
                request.getUserId(),
                request.getPlayerId(),
                userName
        ));
        advanceTurn(window);
    }

    private void performTransfer(long leagueId,
                                 int userId,
                                 int playerOutId,
                                 int playerInId,
                                 boolean supplementalDraft) {
        if (playerOutId == playerInId) {
            throw new FantasyTeamException("Incoming and outgoing player must be different");
        }

        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new FantasyTeamException("User game data was not found"));
        requireGameDataInLeague(gameData, leagueId);
        UserSquadEntity squad = requireNextSquad(gameData);

        PlayerEntity playerOut = playerRepo.findById(playerOutId)
                .orElseThrow(() -> new FantasyTeamException("Outgoing player was not found"));
        PlayerEntity playerIn = playerRepo.findById(playerInId)
                .orElseThrow(() -> new FantasyTeamException("Incoming player was not found"));
        LeagueEntity league = requireLeague(leagueId);

        if (supplementalDraft) {
            LeagueTransferWindowEntity supplementalWindow = windowRepo
                    .findFirstByLeague_IdAndStatusOrderByOpenedAtDesc(
                            leagueId,
                            TransferWindowStatus.OPEN
                    )
                    .filter(window -> window.getWindowType() == TransferWindowType.SUPPLEMENTAL)
                    .orElseThrow(() -> new IllegalStateException("Supplemental draft is not open"));
            supplementalDraftPoolService.requireEligibleAt(
                    leagueId,
                    playerInId,
                    supplementalWindow.getOpenedAt()
            );
        } else if (supplementalDraftPoolService.isEligible(leagueId, playerInId)) {
            throw new FantasyTeamException("Incoming player is reserved for the next supplemental draft");
        }

        if (!containsRosterPlayer(squad, playerOutId)) {
            throw new FantasyTeamException("Outgoing player is not in your active squad");
        }
        if (isPlayerOwnedInLeague(leagueId, playerInId)) {
            throw new FantasyTeamException("Incoming player is already owned in this league");
        }
        if (league.isPlayerLocked(playerInId)) {
            throw new FantasyTeamException("Incoming player is locked in this league");
        }
        if (league.effectivePosition(playerOut) != league.effectivePosition(playerIn)) {
            throw new FantasyTeamException("Players must have the same position");
        }

        validateClubLimit(squad, playerOutId, playerIn);
        replaceRosterPlayer(gameData, squad, playerOutId, playerInId);
        squadRepo.save(squad);
        gameDataRepo.save(gameData);
        log.info("Transfer completed in league {}: user {} | {} -> {}", leagueId, userId, playerOutId, playerInId);
    }

    private void performIrReplacement(long leagueId, int userId, int playerId) {
        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new FantasyTeamException("User game data was not found"));
        requireGameDataInLeague(gameData, leagueId);
        UserSquadEntity squad = requireNextSquad(gameData);

        if (!Boolean.TRUE.equals(gameData.getActiveChips().get("IR"))) {
            throw new FantasyTeamException("IR slot is not active");
        }
        Integer irPlayerId = squad.getIrId();
        if (irPlayerId == null) {
            throw new FantasyTeamException("No player is assigned to IR");
        }
        if (rosterSize(squad) >= 15) {
            throw new FantasyTeamException("Squad already has 15 players");
        }
        if (isPlayerOwnedInLeague(leagueId, playerId)) {
            throw new FantasyTeamException("Player is already owned in this league");
        }

        PlayerEntity irPlayer = playerRepo.findById(irPlayerId)
                .orElseThrow(() -> new FantasyTeamException("IR player was not found"));
        PlayerEntity replacement = playerRepo.findById(playerId)
                .orElseThrow(() -> new FantasyTeamException("Player was not found"));
        LeagueEntity league = requireLeague(leagueId);
        if (supplementalDraftPoolService.isEligible(leagueId, playerId)) {
            throw new FantasyTeamException("Player is reserved for the next supplemental draft");
        }
        if (league.isPlayerLocked(playerId)) {
            throw new FantasyTeamException("Player is locked in this league");
        }
        if (league.effectivePosition(irPlayer) != league.effectivePosition(replacement)) {
            throw new FantasyTeamException("Player position must match the IR player position");
        }

        Map<String, Integer> bench = new LinkedHashMap<>(squad.getBenchMap());
        String slot = league.effectivePosition(replacement) == PlayerPosition.GOALKEEPER ? "GK" : "S3";
        if (bench.get(slot) != null) {
            throw new FantasyTeamException("Required bench slot is already occupied");
        }
        validateClubLimit(squad, null, replacement, true);
        bench.put(slot, playerId);
        squad.setBenchMap(bench);
        squadRepo.save(squad);
        log.info("IR replacement completed in league {}: user {} signed {}", leagueId, userId, playerId);
    }

    private void replaceRosterPlayer(UserGameDataEntity gameData,
                                     UserSquadEntity squad,
                                     int playerOutId,
                                     int playerInId) {
        boolean forfeitsFirstPickCaptain = Objects.equals(squad.getFirstPickId(), playerOutId)
                && Boolean.TRUE.equals(gameData.getActiveChips().get("FIRST_PICK_CAPTAIN"));
        List<Integer> lineup = new ArrayList<>(squad.getStartingLineup());
        int lineupIndex = lineup.indexOf(playerOutId);
        if (lineupIndex >= 0) {
            lineup.set(lineupIndex, playerInId);
            squad.setStartingLineup(lineup);
        } else {
            Map<String, Integer> bench = new LinkedHashMap<>(squad.getBenchMap());
            String slot = bench.entrySet().stream()
                    .filter(entry -> Objects.equals(entry.getValue(), playerOutId))
                    .map(Map.Entry::getKey)
                    .findFirst()
                    .orElseThrow(() -> new FantasyTeamException("Outgoing player is not in your active squad"));
            bench.put(slot, playerInId);
            squad.setBenchMap(bench);
        }

        if (forfeitsFirstPickCaptain) {
            gameData.getActiveChips().put("FIRST_PICK_CAPTAIN", false);
            gameData.getChips().put("FIRST_PICK_CAPTAIN", 0);
            squad.setFirstPickId(null);
            assignRandomCaptain(squad);
        } else if (Objects.equals(squad.getCaptainId(), playerOutId)) {
            squad.setCaptainId(playerInId);
        }
        if (Objects.equals(squad.getViceCaptainId(), playerOutId)) squad.setViceCaptainId(playerInId);
        if (!forfeitsFirstPickCaptain && Objects.equals(squad.getFirstPickId(), playerOutId)) {
            squad.setFirstPickId(null);
        }
    }

    private void assignRandomCaptain(UserSquadEntity squad) {
        List<Integer> candidates = squad.getStartingLineup().stream()
                .filter(Objects::nonNull)
                .filter(playerId -> !Objects.equals(playerId, squad.getViceCaptainId()))
                .toList();
        if (candidates.isEmpty()) {
            throw new FantasyTeamException("No eligible captain remains in the starting lineup");
        }
        int selectedIndex = java.util.concurrent.ThreadLocalRandom.current().nextInt(candidates.size());
        squad.setCaptainId(candidates.get(selectedIndex));
    }

    private void validateClubLimit(UserSquadEntity squad,
                                   Integer outgoingPlayerId,
                                   PlayerEntity incomingPlayer) {
        validateClubLimit(squad, outgoingPlayerId, incomingPlayer, false);
    }

    private void validateClubLimit(UserSquadEntity squad,
                                   Integer outgoingPlayerId,
                                   PlayerEntity incomingPlayer,
                                   boolean includeIrPlayer) {
        if (incomingPlayer.getTeamId() == null) {
            return;
        }
        Set<Integer> prospectiveRoster = rosterPlayerIds(squad);
        if (includeIrPlayer && squad.getIrId() != null) prospectiveRoster.add(squad.getIrId());
        if (outgoingPlayerId != null) prospectiveRoster.remove(outgoingPlayerId);
        prospectiveRoster.add(incomingPlayer.getId());
        int playersFromClub = 0;
        for (PlayerEntity player : playerRepo.findAllById(prospectiveRoster)) {
            if (Objects.equals(player.getTeamId(), incomingPlayer.getTeamId())) {
                playersFromClub++;
            }
        }
        if (playersFromClub > 3) {
            throw new FantasyTeamException("Cannot have more than 3 players from the same club");
        }
    }

    private boolean isPlayerOwnedInLeague(long leagueId, int playerId) {
        return gameDataRepo.findAllByLeagueIdWithSquads(leagueId).stream()
                .map(UserGameDataEntity::getNextSquad)
                .filter(Objects::nonNull)
                .anyMatch(squad -> containsOwnedPlayer(squad, playerId));
    }

    private boolean containsOwnedPlayer(UserSquadEntity squad, int playerId) {
        return containsRosterPlayer(squad, playerId) || Objects.equals(squad.getIrId(), playerId);
    }

    private boolean containsRosterPlayer(UserSquadEntity squad, int playerId) {
        return squad.getStartingLineup().contains(playerId) || squad.getBenchMap().containsValue(playerId);
    }

    private Set<Integer> rosterPlayerIds(UserSquadEntity squad) {
        Set<Integer> ids = new LinkedHashSet<>(squad.getStartingLineup());
        squad.getBenchMap().values().stream().filter(Objects::nonNull).forEach(ids::add);
        return ids;
    }

    private int rosterSize(UserSquadEntity squad) {
        return rosterPlayerIds(squad).size();
    }

    private UserSquadEntity requireNextSquad(UserGameDataEntity gameData) {
        return Optional.ofNullable(gameData.getNextSquad())
                .orElseThrow(() -> new FantasyTeamException("Squad for the next gameweek does not exist"));
    }

    private void requireGameDataInLeague(UserGameDataEntity gameData, long leagueId) {
        if (gameData.getLeague() == null || !Objects.equals(gameData.getLeague().getId(), leagueId)) {
            throw new FantasyTeamException("User does not belong to this league");
        }
    }

    private LeagueEntity requireLeague(long leagueId) {
        return leagueRepo.findById(leagueId)
                .orElseThrow(() -> new FantasyTeamException("League was not found"));
    }

    private LeagueTransferWindowEntity activeWindowForUser(int userId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(userId);
        List<LeagueTransferWindowEntity> windows = windowRepo.findByLeagueAndStatusForUpdate(
                leagueId,
                TransferWindowStatus.OPEN
        );
        if (windows.isEmpty()) {
            throw new IllegalStateException("Transfer window is not active");
        }
        if (windows.size() > 1) {
            throw new IllegalStateException("More than one transfer window is open for this league");
        }
        LeagueTransferWindowEntity window = windows.getFirst();
        if (window.getWindowType() == TransferWindowType.TRANSFER && isLineupDeadlineReached(window)) {
            throw new IllegalStateException("The lineup deadline has passed");
        }
        return window;
    }

    private void validateTurn(LeagueTransferWindowEntity window, int userId) {
        int currentUserId = window.currentUserId().orElse(-1);
        if (currentUserId != userId) {
            throw new IllegalStateException("Not your turn. Current user is " + currentUserId);
        }
    }

    private void advanceTurn(LeagueTransferWindowEntity window) {
        long leagueId = window.getLeague().getId();
        window.advanceTurn();
        windowRepo.saveAndFlush(window);

        if (window.getStatus() == TransferWindowStatus.CLOSED) {
            handleWindowClosed(window);
            publishLifecycleChanged("window closed for league " + leagueId);
            return;
        }

        int nextUserId = window.currentUserId().orElseThrow();
        List<Integer> remainingOrder = window.remainingOrder();
        Map<Integer, Integer> turnsUsed = window.turnsUsed();
        if (window.getPhase() == TransferWindowPhase.IR) {
            String irPosition = irPositionCode(nextUserId);
            publishAfterCommit(() -> webSocketController.sendIRTurnStartedEvent(
                    leagueId,
                    nextUserId,
                    irPosition,
                    remainingOrder,
                    turnsUsed
            ));
        } else {
            publishAfterCommit(() -> webSocketController.sendTurnStartedEvent(
                    leagueId,
                    nextUserId,
                    remainingOrder,
                    "REGULAR",
                    turnsUsed
            ));
        }
        publishTransferTurnChanged(leagueId);
        int nextCursor = window.getPhase() == TransferWindowPhase.IR
                ? window.getIrCursor()
                : window.getRegularCursor();
        if (!window.isAutomaticForUser(nextUserId)) {
            publishUserNotification(
                    leagueId,
                    nextUserId,
                    yourTurnNotification(
                            window.getWindowType(),
                            notificationWindowId(window),
                            window.getPhase().name(),
                            nextCursor
                    )
            );
        }
    }

    private com.fantasy.domain.notification.NotificationEvent openedNotification(
            TransferWindowType type,
            long windowId,
            int gameweekId) {
        if (type == TransferWindowType.TRANSFER) {
            return NotificationEvents.windowOpened(windowId, gameweekId);
        }
        return NotificationEvents.draftOpened(
                windowId,
                gameweekId,
                type == TransferWindowType.SUPPLEMENTAL
        );
    }

    private com.fantasy.domain.notification.NotificationEvent yourTurnNotification(
            TransferWindowType type,
            long windowId,
            String phase,
            int cursor) {
        if (type == TransferWindowType.TRANSFER) {
            return NotificationEvents.yourTurn(windowId, phase, cursor);
        }
        return NotificationEvents.yourDraftTurn(
                windowId,
                phase,
                cursor,
                type == TransferWindowType.SUPPLEMENTAL
        );
    }

    private long notificationWindowId(LeagueTransferWindowEntity window) {
        if (window.getId() != null) return window.getId();
        long syntheticId = window.getLeague().getId() * 100_000L
                + window.getGameWeek().getId() * 10L
                + window.getWindowType().ordinal();
        return -syntheticId;
    }

    private void handleWindowClosed(LeagueTransferWindowEntity window) {
        long leagueId = window.getLeague().getId();
        TransferWindowType type = window.getWindowType();
        int gameWeekId = window.getGameWeek().getId();
        if (type == TransferWindowType.DRAFT) {
            LeagueEntity league = window.getLeague();
            arrangeCompletedInitialDraft(league.getId());
            league.setStatus(LeagueStatus.ACTIVE);
            leagueRepo.save(league);
            prepareFirstTransferOrder(window);
        } else if (type == TransferWindowType.SUPPLEMENTAL) {
            supplementalDraftPoolService.releaseEligiblePool(leagueId, window.getOpenedAt());
        } else if (type == TransferWindowType.TRANSFER) {
            prepareNextWeekOrder(window);
        }
        publishAfterCommit(() -> webSocketController.sendWindowClosedEvent(leagueId));
        log.info("{} window closed for league {} and GW {}", type, leagueId, gameWeekId);
    }

    @Transactional
    public void closeWindow(long leagueId) {
        List<LeagueTransferWindowEntity> windows = windowRepo.findByLeagueAndStatusForUpdate(
                leagueId,
                TransferWindowStatus.OPEN
        );
        if (windows.isEmpty()) {
            return;
        }
        for (LeagueTransferWindowEntity window : windows) {
            if (window.getWindowType() == TransferWindowType.DRAFT) {
                throw new IllegalStateException("The initial draft cannot be closed manually");
            }
            window.close();
            if (window.getWindowType() == TransferWindowType.TRANSFER) {
                prepareNextWeekOrder(window);
            } else if (window.getWindowType() == TransferWindowType.SUPPLEMENTAL) {
                supplementalDraftPoolService.releaseEligiblePool(leagueId, window.getOpenedAt());
            }
        }
        windowRepo.saveAll(windows);
        publishAfterCommit(() -> webSocketController.sendWindowClosedEvent(leagueId));
    }

    @Transactional
    public void closeAllOpenWindows() {
        List<Long> leagueIds = windowRepo.findAllByStatus(TransferWindowStatus.OPEN).stream()
                .map(window -> window.getLeague().getId())
                .distinct()
                .toList();
        leagueIds.forEach(this::closeWindow);
    }

    @Transactional
    public void setManualTurnOrder(int actingUserId, int gameWeekId, TurnOrderDto dto) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(actingUserId);
        leagueAccessService.requireLeagueAdmin(actingUserId, leagueId);
        setManualTurnOrderForLeague(leagueId, gameWeekId, dto);
    }

    @Transactional
    public void setManualTurnOrderForLeague(long leagueId, int gameWeekId, TurnOrderDto dto) {
        LeagueEntity league = leagueRepo.findByIdWithLock(leagueId)
                .orElseThrow(() -> new IllegalArgumentException("League was not found"));
        GameWeekEntity gameWeek = gameWeekRepo.findById(gameWeekId)
                .orElseThrow(() -> new IllegalArgumentException("GameWeek not found: " + gameWeekId));
        List<Integer> order = dto.getOrder() == null ? List.of() : new ArrayList<>(dto.getOrder());
        if (order.isEmpty()) {
            throw new IllegalArgumentException("Transfer order cannot be empty");
        }

        LeagueTransferWindowEntity window = windowRepo
                .findConfiguredWindowForUpdate(leagueId, gameWeekId, TransferWindowType.TRANSFER)
                .orElseGet(LeagueTransferWindowEntity::new);
        if (window.getStatus() == TransferWindowStatus.OPEN) {
            throw new IllegalStateException("Cannot change the order while the window is open");
        }
        if (window.getStatus() == TransferWindowStatus.CLOSED) {
            throw new IllegalStateException("Cannot change a completed window");
        }
        List<Integer> canonicalOrder = new ArrayList<>(window.getCanonicalOrder());
        if (canonicalOrder.isEmpty()) {
            canonicalOrder = window.getTurnOrder().isEmpty()
                    ? defaultOrderForLeague(league, gameWeek, TransferWindowType.TRANSFER)
                    : new ArrayList<>(window.getTurnOrder());
        }
        validateOrderBelongsToLeague(league, order, TransferWindowType.TRANSFER);
        if (order.size() != canonicalOrder.size()) {
            throw new IllegalArgumentException(
                    "Trading turns may reassign picks but cannot add or remove transfer picks"
            );
        }
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setWindowType(TransferWindowType.TRANSFER);
        window.setCanonicalOrder(canonicalOrder);
        window.setTurnOrder(order);
        windowRepo.save(window);
    }

    @Transactional(readOnly = true)
    public List<Integer> getCurrentTurnOrder(int requestingUserId, int gameWeekId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(requestingUserId);
        return getConfiguredTransferOrderForLeague(leagueId, gameWeekId);
    }

    @Transactional(readOnly = true)
    public List<Integer> getConfiguredTransferOrderForLeague(long leagueId, int gameWeekId) {
        return windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                        leagueId,
                        gameWeekId,
                        TransferWindowType.TRANSFER
                )
                .<List<Integer>>map(window -> new ArrayList<>(window.getTurnOrder()))
                .orElseGet(() -> firstTransferOrderFromDraft(leagueId, gameWeekId)
                        .orElseGet(ArrayList::new));
    }

    @Transactional(readOnly = true)
    public List<TransferActionDto> getTransferHistory(int requestingUserId, int gameWeekId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(requestingUserId);
        return getTransferHistoryForLeague(leagueId, gameWeekId);
    }

    @Transactional(readOnly = true)
    public List<TransferActionDto> getTransferHistoryForLeague(long leagueId, int gameWeekId) {
        return transferActionRepo.findByLeague_IdAndGameWeek_IdOrderByIdAsc(leagueId, gameWeekId).stream()
                .map(action -> new TransferActionDto(
                        action.getId(),
                        action.getGameWeek().getId(),
                        action.getUser().getId(),
                        action.getUser().getName(),
                        action.getWindowType(),
                        action.getSource(),
                        action.getPlayerInId(),
                        action.getPlayerOutId(),
                        action.getCreatedAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentWindowState(int requestingUserId) {
        long leagueId = leagueAccessService.requireLeagueIdForUser(requestingUserId);
        return buildCurrentWindowState(leagueId, requestingUserId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCurrentWindowStateForLeague(long leagueId) {
        if (!leagueRepo.existsById(leagueId)) {
            throw new IllegalArgumentException("League was not found");
        }
        return buildCurrentWindowState(leagueId, null);
    }

    private Map<String, Object> buildCurrentWindowState(long leagueId, Integer requestingUserId) {
        Optional<LeagueTransferWindowEntity> activeWindow = windowRepo
                .findFirstByLeague_IdAndStatusOrderByOpenedAtDesc(leagueId, TransferWindowStatus.OPEN);

        Map<String, Object> state = new LinkedHashMap<>();
        state.put("leagueId", leagueId);
        state.put("isOpen", activeWindow.isPresent());
        if (activeWindow.isEmpty()) {
            List<Integer> leagueUserIds = leagueRepo.findUserIdsByLeagueId(leagueId);
            state.put("gameWeekId", -1);
            state.put("isDraftMode", false);
            state.put("draftType", null);
            state.put("currentUserId", null);
            state.put("currentRound", null);
            state.put("order", null);
            state.put("initialOrder", null);
            state.put("canonicalOrder", null);
            state.put("turnsUsed", null);
            state.put("totalTurns", null);
            state.put("automaticUserIds", List.of());
            state.put("onlineUserIds", presenceService.onlineUserIds(leagueUserIds));
            state.put("activeUserIds", presenceService.activeUserIds(leagueUserIds));
            return state;
        }

        LeagueTransferWindowEntity window = activeWindow.get();
        state.put("gameWeekId", window.getGameWeek().getId());
        state.put("isDraftMode", window.getWindowType() != TransferWindowType.TRANSFER);
        state.put("draftType", window.getWindowType() == TransferWindowType.DRAFT
                ? DraftType.INITIAL.name()
                : window.getWindowType() == TransferWindowType.SUPPLEMENTAL
                    ? DraftType.SUPPLEMENTAL.name()
                    : null);
        state.put("currentUserId", window.currentUserId().orElse(null));
        state.put("currentRound", window.getPhase().name());
        state.put("order", window.remainingOrder());
        state.put("initialOrder", window.initialOrder());
        state.put("canonicalOrder", new ArrayList<>(window.getCanonicalOrder()));
        state.put("turnsUsed", window.turnsUsed());
        state.put("totalTurns", window.totalTurns());
        state.put("automaticUserIds", window.getAutomaticUserIds());
        List<Integer> leagueUserIds = window.getLeague().getUsers().stream().map(UserEntity::getId).toList();
        state.put("onlineUserIds", presenceService.onlineUserIds(leagueUserIds));
        state.put("activeUserIds", presenceService.activeUserIds(leagueUserIds));
        if (requestingUserId != null) {
            state.put("requestingUserAutomatic", window.isAutomaticForUser(requestingUserId));
        }
        state.put("currentUserAutomatic", window.currentUserId()
                .map(window::isAutomaticForUser)
                .orElse(false));
        return state;
    }

    @Transactional(readOnly = true)
    public List<Long> getOpenLeagueIds() {
        return windowRepo.findAllByStatus(TransferWindowStatus.OPEN).stream()
                .map(window -> window.getLeague().getId())
                .distinct()
                .toList();
    }

    @Transactional
    public boolean processAutomaticTurn(long leagueId) {
        List<LeagueTransferWindowEntity> windows = windowRepo.findByLeagueAndStatusForUpdate(
                leagueId,
                TransferWindowStatus.OPEN
        );
        if (windows.size() != 1) return false;

        LeagueTransferWindowEntity window = windows.getFirst();
        if (window.getWindowType() != TransferWindowType.TRANSFER
                || window.getTurnStartedAt() == null) {
            return false;
        }
        if (isLineupDeadlineReached(window)) {
            finalizeExpiredWindow(window);
            return true;
        }

        int userId = window.currentUserId().orElse(-1);
        if (userId < 0 || !window.isAutomaticForUser(userId)) return false;

        if (window.getPhase() == TransferWindowPhase.IR) {
            processAutomatedIrTurn(window, userId);
            advanceTurn(window);
            return true;
        }

        int nextPriority = waiverProgressRepo
                .findByLeague_IdAndUser_IdAndGameWeek_Id(leagueId, userId, window.getGameWeek().getId())
                .map(WaiverPlanProgressEntity::getNextPriority)
                .orElse(1);
        List<WaiverPreferenceEntity> preferences = waiverPreferenceRepo
                .findByLeague_IdAndUser_IdAndGameWeek_IdAndPlanTypeOrderByPriorityAsc(
                        leagueId,
                        userId,
                        window.getGameWeek().getId(),
                        WaiverPlanType.REGULAR
                ).stream()
                .filter(preference -> preference.getPriority() >= nextPriority)
                .toList();
        WaiverPreferenceEntity completedPreference = null;
        int nextPriorityAfterAttempts = nextPriority;
        for (WaiverPreferenceEntity preference : preferences) {
            nextPriorityAfterAttempts = Math.max(nextPriorityAfterAttempts, preference.getPriority() + 1);
            try {
                performTransfer(
                        leagueId,
                        userId,
                        preference.getPlayerOutId(),
                        preference.getPlayerInId(),
                        false
                );
                completedPreference = preference;
                break;
            } catch (FantasyTeamException | IllegalStateException rejectedPreference) {
                log.debug(
                        "Skipping waiver preference {} for user {}: {}",
                        preference.getPriority(),
                        userId,
                        rejectedPreference.getMessage()
                );
            }
        }

        String userName = getUserName(userId);
        if (completedPreference == null) {
            if (!preferences.isEmpty()) {
                updateWaiverProgress(window, userId, nextPriorityAfterAttempts);
            }
            publishAfterCommit(() -> webSocketController.sendPassEvent(leagueId, userId, userName));
        } else {
            updateWaiverProgress(window, userId, completedPreference.getPriority() + 1);
            int playerOutId = completedPreference.getPlayerOutId();
            int playerInId = completedPreference.getPlayerInId();
            recordAction(
                    window,
                    userId,
                    TransferActionSource.WAIVER,
                    playerInId,
                    playerOutId
            );
            publishAfterCommit(() -> webSocketController.sendTransferDoneEvent(
                    leagueId,
                    userId,
                    playerOutId,
                    playerInId,
                    userName
            ));
        }
        advanceTurn(window);
        return true;
    }

    /**
     * Kept temporarily as a compatibility entry point for simulations and older callers.
     * Automation is now driven exclusively by the user's persisted per-window preference,
     * never by WebSocket presence.
     */
    @Transactional
    public void processOfflineTurn(long leagueId) {
        processAutomaticTurn(leagueId);
    }

    @Transactional
    public void finalizeExpiredWindow(long leagueId) {
        List<LeagueTransferWindowEntity> windows = windowRepo.findByLeagueAndStatusForUpdate(
                leagueId,
                TransferWindowStatus.OPEN
        );
        if (windows.size() != 1) return;
        LeagueTransferWindowEntity window = windows.getFirst();
        if (window.getWindowType() == TransferWindowType.TRANSFER && isLineupDeadlineReached(window)) {
            finalizeExpiredWindow(window);
        }
    }

    @Transactional
    public void finalizeWindowsAtGameweekDeadline(int gameWeekId) {
        List<LeagueTransferWindowEntity> windows = windowRepo.findByGameweekAndStatusForUpdate(
                gameWeekId,
                TransferWindowStatus.OPEN
        );
        for (LeagueTransferWindowEntity window : windows) {
            if (window.getWindowType() == TransferWindowType.DRAFT) {
                throw new IllegalStateException(
                        "Cannot open GW " + gameWeekId + " while the initial draft is still active"
                );
            }
            if (window.getWindowType() == TransferWindowType.TRANSFER) {
                finalizeExpiredWindow(window);
                continue;
            }

            window.close();
            windowRepo.saveAndFlush(window);
            handleWindowClosed(window);
        }
    }

    private void finalizeExpiredWindow(LeagueTransferWindowEntity window) {
        if (window.getPhase() == TransferWindowPhase.REGULAR) {
            window.finishRegularPhase();
            windowRepo.saveAndFlush(window);
            if (window.getStatus() == TransferWindowStatus.CLOSED) {
                handleWindowClosed(window);
                return;
            }
        }

        while (window.getStatus() == TransferWindowStatus.OPEN
                && window.getPhase() == TransferWindowPhase.IR) {
            int irUserId = window.currentUserId().orElse(-1);
            if (irUserId < 0) {
                window.close();
                windowRepo.saveAndFlush(window);
                handleWindowClosed(window);
                return;
            }
            processAutomatedIrTurn(window, irUserId);
            advanceTurn(window);
        }
    }

    private boolean isLineupDeadlineReached(LeagueTransferWindowEntity window) {
        LocalDateTime deadline = window.getGameWeek().getFirstKickoffTime();
        return deadline != null && !LocalDateTime.now().isBefore(deadline);
    }

    private void updateWaiverProgress(LeagueTransferWindowEntity window, int userId, int nextPriority) {
        WaiverPlanProgressEntity progress = waiverProgressRepo
                .findByLeague_IdAndUser_IdAndGameWeek_Id(
                        window.getLeague().getId(), userId, window.getGameWeek().getId()
                )
                .orElseGet(WaiverPlanProgressEntity::new);
        progress.setLeague(window.getLeague());
        progress.setGameWeek(window.getGameWeek());
        progress.setUser(userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User was not found")));
        progress.setNextPriority(nextPriority);
        waiverProgressRepo.save(progress);
    }

    private void processAutomatedIrTurn(LeagueTransferWindowEntity window, int userId) {
        long leagueId = window.getLeague().getId();
        int gameWeekId = window.getGameWeek().getId();
        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId).orElse(null);
        Integer irPlayerId = gameData == null || gameData.getNextSquad() == null
                ? null
                : gameData.getNextSquad().getIrId();
        Integer selectedPlayerId = null;

        List<WaiverPreferenceEntity> preferences = waiverPreferenceRepo
                .findByLeague_IdAndUser_IdAndGameWeek_IdAndPlanTypeOrderByPriorityAsc(
                        leagueId, userId, gameWeekId, WaiverPlanType.IR
                );
        for (WaiverPreferenceEntity preference : preferences) {
            if (tryIrReplacement(leagueId, userId, preference.getPlayerInId())) {
                selectedPlayerId = preference.getPlayerInId();
                break;
            }
        }

        if (selectedPlayerId == null) {
            List<PlayerEntity> fallbackPlayers = playerRepo.findAll().stream()
                    .sorted(Comparator.comparingInt(PlayerEntity::getTotalPoints).reversed()
                            .thenComparing(PlayerEntity::getId))
                    .toList();
            for (PlayerEntity player : fallbackPlayers) {
                if (tryIrReplacement(leagueId, userId, player.getId())) {
                    selectedPlayerId = player.getId();
                    break;
                }
            }
        }

        if (selectedPlayerId == null) {
            log.warn("No legal IR replacement was available for user {} in league {}", userId, leagueId);
            return;
        }

        int completedPlayerId = selectedPlayerId;
        recordAction(window, userId, TransferActionSource.IR_WAIVER, completedPlayerId, irPlayerId);
        String userName = getUserName(userId);
        publishAfterCommit(() -> webSocketController.sendTransferDoneEvent(
                leagueId, userId, completedPlayerId, userName
        ));
    }

    private boolean tryIrReplacement(long leagueId, int userId, int playerId) {
        try {
            performIrReplacement(leagueId, userId, playerId);
            return true;
        } catch (FantasyTeamException | IllegalStateException rejectedPlayer) {
            log.debug("Skipping IR candidate {} for user {}: {}", playerId, userId, rejectedPlayer.getMessage());
            return false;
        }
    }

    private void recordAction(LeagueTransferWindowEntity window,
                              int userId,
                              TransferActionSource source,
                              int playerInId,
                              Integer playerOutId) {
        LeagueTransferActionEntity action = new LeagueTransferActionEntity();
        action.setLeague(window.getLeague());
        action.setGameWeek(window.getGameWeek());
        action.setUser(userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User was not found")));
        action.setWindowType(window.getWindowType());
        action.setSource(source);
        action.setPlayerInId(playerInId);
        action.setPlayerOutId(playerOutId);
        transferActionRepo.save(action);
    }

    private List<Integer> defaultOrderForLeague(LeagueEntity league,
                                                GameWeekEntity gameWeek,
                                                TransferWindowType type) {
        if (type == TransferWindowType.TRANSFER) {
            Optional<List<Integer>> draftBasedOrder = firstTransferOrderFromDraft(
                    league.getId(),
                    gameWeek.getId()
            );
            if (draftBasedOrder.isPresent()) {
                return draftBasedOrder.get();
            }
        }

        List<UserGameDataEntity> standings = gameDataRepo.findByLeague_Id(league.getId()).stream()
                .filter(data -> data.getUser() != null)
                .sorted(Comparator.comparingInt(UserGameDataEntity::getTotalPoints)
                        .thenComparing(data -> data.getUser().getId()))
                .toList();
        List<Integer> firstRound = standings.stream().map(data -> data.getUser().getId()).toList();
        if (firstRound.isEmpty()) {
            firstRound = league.getUsers().stream().map(UserEntity::getId).sorted().toList();
        }
        return snakeOrder(firstRound);
    }

    private Optional<List<Integer>> firstTransferOrderFromDraft(long leagueId, int gameWeekId) {
        return windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                        leagueId,
                        gameWeekId,
                        TransferWindowType.DRAFT
                )
                .filter(window -> window.getStatus() == TransferWindowStatus.CLOSED)
                .map(LeagueTransferWindowEntity::initialOrder)
                .filter(order -> !order.isEmpty())
                .map(order -> {
                    Integer firstDraftPicker = order.removeFirst();
                    order.add(firstDraftPicker);
                    return snakeOrder(order);
                });
    }

    private List<Integer> snakeOrder(List<Integer> firstRound) {
        List<Integer> order = new ArrayList<>(firstRound);
        List<Integer> reverse = new ArrayList<>(firstRound);
        Collections.reverse(reverse);
        order.addAll(reverse);
        return order;
    }

    private void prepareNextWeekOrder(LeagueTransferWindowEntity completedWindow) {
        int nextGameWeekId = completedWindow.getGameWeek().getId() + 1;
        Optional<GameWeekEntity> nextGameWeek = gameWeekRepo.findById(nextGameWeekId);
        if (nextGameWeek.isEmpty()) {
            return;
        }
        long leagueId = completedWindow.getLeague().getId();
        if (windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                leagueId,
                nextGameWeekId,
                TransferWindowType.TRANSFER
        ).isPresent()) {
            return;
        }

        List<Integer> baseOrder = completedWindow.canonicalInitialOrder();
        if (!baseOrder.isEmpty()) {
            Integer first = baseOrder.removeFirst();
            baseOrder.add(first);
        }
        LeagueTransferWindowEntity nextWindow = new LeagueTransferWindowEntity();
        nextWindow.setLeague(completedWindow.getLeague());
        nextWindow.setGameWeek(nextGameWeek.get());
        nextWindow.setWindowType(TransferWindowType.TRANSFER);
        List<Integer> nextOrder = snakeOrder(baseOrder);
        nextWindow.setTurnOrder(nextOrder);
        nextWindow.setCanonicalOrder(nextOrder);
        windowRepo.save(nextWindow);
    }

    private void prepareFirstTransferOrder(LeagueTransferWindowEntity completedDraft) {
        int firstGameWeekId = completedDraft.getGameWeek().getId();
        long leagueId = completedDraft.getLeague().getId();
        if (windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                leagueId,
                firstGameWeekId,
                TransferWindowType.TRANSFER
        ).isPresent()) {
            return;
        }

        List<Integer> baseOrder = completedDraft.initialOrder();
        if (!baseOrder.isEmpty()) {
            Integer firstDraftPicker = baseOrder.removeFirst();
            baseOrder.add(firstDraftPicker);
        }

        LeagueTransferWindowEntity firstWindow = new LeagueTransferWindowEntity();
        firstWindow.setLeague(completedDraft.getLeague());
        firstWindow.setGameWeek(completedDraft.getGameWeek());
        firstWindow.setWindowType(TransferWindowType.TRANSFER);
        List<Integer> firstOrder = snakeOrder(baseOrder);
        firstWindow.setTurnOrder(firstOrder);
        firstWindow.setCanonicalOrder(firstOrder);
        windowRepo.save(firstWindow);
    }

    private void arrangeCompletedInitialDraft(long leagueId) {
        LeagueEntity league = requireLeague(leagueId);
        for (UserGameDataEntity gameData : gameDataRepo.findAllByLeagueIdWithSquads(leagueId)) {
            UserSquadEntity squad = requireNextSquad(gameData);
            List<Integer> draftedOrder = new ArrayList<>(new LinkedHashSet<>(rosterPlayerIds(squad)));
            Map<Integer, PlayerEntity> players = playerRepo.findAllById(draftedOrder).stream()
                    .collect(java.util.stream.Collectors.toMap(PlayerEntity::getId, player -> player));

            Map<PlayerPosition, List<Integer>> byPosition = new java.util.EnumMap<>(PlayerPosition.class);
            for (PlayerPosition position : PlayerPosition.values()) {
                byPosition.put(position, new ArrayList<>());
            }
            for (Integer playerId : draftedOrder) {
                PlayerEntity player = players.get(playerId);
                if (player != null) {
                    byPosition.get(league.effectivePosition(player)).add(playerId);
                }
            }

            requireDraftPositionCount(byPosition, PlayerPosition.GOALKEEPER, 2);
            requireDraftPositionCount(byPosition, PlayerPosition.DEFENDER, 5);
            requireDraftPositionCount(byPosition, PlayerPosition.MIDFIELDER, 5);
            requireDraftPositionCount(byPosition, PlayerPosition.FORWARD, 3);

            Set<Integer> starters = new LinkedHashSet<>();
            starters.add(byPosition.get(PlayerPosition.GOALKEEPER).getFirst());
            starters.addAll(byPosition.get(PlayerPosition.DEFENDER).subList(0, 3));
            starters.addAll(byPosition.get(PlayerPosition.MIDFIELDER).subList(0, 4));
            starters.addAll(byPosition.get(PlayerPosition.FORWARD));

            List<Integer> orderedStarters = draftedOrder.stream().filter(starters::contains).toList();
            List<Integer> outfieldBench = draftedOrder.stream()
                    .filter(playerId -> !starters.contains(playerId))
                    .filter(playerId -> !byPosition.get(PlayerPosition.GOALKEEPER).contains(playerId))
                    .toList();
            Map<String, Integer> bench = new LinkedHashMap<>();
            bench.put("GK", byPosition.get(PlayerPosition.GOALKEEPER).get(1));
            bench.put("S1", outfieldBench.get(0));
            bench.put("S2", outfieldBench.get(1));
            bench.put("S3", outfieldBench.get(2));

            squad.setStartingLineup(new ArrayList<>(orderedStarters));
            squad.setBenchMap(bench);
            squad.setFormation(new LinkedHashMap<>(Map.of(
                    "GK", 1,
                    "DEF", 3,
                    "MID", 4,
                    "FWD", 3
            )));
            List<Integer> captainCandidates = orderedStarters.stream()
                    .filter(playerId -> !Objects.equals(playerId, squad.getFirstPickId()))
                    .toList();
            squad.setCaptainId(captainCandidates.get(0));
            squad.setViceCaptainId(captainCandidates.get(1));
            squadRepo.save(squad);
        }
    }

    private void requireDraftPositionCount(Map<PlayerPosition, List<Integer>> byPosition,
                                           PlayerPosition position,
                                           int expected) {
        int actual = byPosition.getOrDefault(position, List.of()).size();
        if (actual != expected) {
            throw new IllegalStateException(
                    "Initial draft cannot complete: expected " + expected + " " + position + " players but found " + actual
            );
        }
    }

    private List<Integer> findUsersEligibleForIr(long leagueId, List<Integer> order) {
        Map<Integer, UserGameDataEntity> leagueData = new HashMap<>();
        for (UserGameDataEntity data : gameDataRepo.findAllByLeagueIdWithSquads(leagueId)) {
            if (data.getUser() != null) {
                leagueData.put(data.getUser().getId(), data);
            }
        }

        List<Integer> eligible = new ArrayList<>();
        Set<Integer> checked = new HashSet<>();
        for (Integer userId : order) {
            if (!checked.add(userId)) continue;
            UserGameDataEntity data = leagueData.get(userId);
            if (data == null || data.getNextSquad() == null) continue;
            UserSquadEntity squad = data.getNextSquad();
            boolean hasIr = Boolean.TRUE.equals(data.getActiveChips().get("IR"));
            boolean missingPlayer = rosterSize(squad) < 15;
            boolean benchFree = squad.getBenchMap().get("S3") == null || squad.getBenchMap().get("GK") == null;
            if (hasIr && squad.getIrId() != null && missingPlayer && benchFree) {
                eligible.add(userId);
            }
        }
        return eligible;
    }

    private String irPositionCode(int userId) {
        return gameDataRepo.findByUserId(userId)
                .map(gameData -> {
                    UserSquadEntity squad = gameData.getNextSquad();
                    if (squad == null || squad.getIrId() == null || gameData.getLeague() == null) return "UNKNOWN";
                    return playerRepo.findById(squad.getIrId())
                            .map(gameData.getLeague()::effectivePosition)
                            .map(PlayerPosition::getCode)
                            .orElse("UNKNOWN");
                })
                .orElse("UNKNOWN");
    }

    private void validateOrderBelongsToLeague(LeagueEntity league,
                                              List<Integer> order,
                                              TransferWindowType type) {
        Set<Integer> leagueUsers = leagueUserIds(league);
        if (order.isEmpty() || order.stream().anyMatch(userId -> !leagueUsers.contains(userId))) {
            throw new IllegalArgumentException("Transfer order contains a user outside this league");
        }
        if (type == TransferWindowType.SUPPLEMENTAL) {
            Map<Integer, Integer> turnsPerUser = new HashMap<>();
            for (Integer userId : order) {
                if (turnsPerUser.merge(userId, 1, Integer::sum) > 2) {
                    throw new IllegalArgumentException("A user cannot receive more than two turns");
                }
            }
        }
    }

    private void validateDraftPositionLimit(UserSquadEntity squad,
                                            LeagueEntity league,
                                            PlayerEntity incomingPlayer) {
        Map<PlayerPosition, Integer> limits = Map.of(
                PlayerPosition.GOALKEEPER, 2,
                PlayerPosition.DEFENDER, 5,
                PlayerPosition.MIDFIELDER, 5,
                PlayerPosition.FORWARD, 3
        );
        PlayerPosition incomingPosition = league.effectivePosition(incomingPlayer);
        long existing = playerRepo.findAllById(rosterPlayerIds(squad)).stream()
                .filter(player -> league.effectivePosition(player) == incomingPosition)
                .count();
        if (existing >= limits.get(incomingPosition)) {
            throw new FantasyTeamException("Maximum initial-draft capacity reached for " + incomingPosition);
        }
    }

    private Set<Integer> leagueUserIds(LeagueEntity league) {
        Set<Integer> result = new LinkedHashSet<>();
        league.getUsers().stream().map(UserEntity::getId).forEach(result::add);
        return result;
    }

    private String getUserName(int userId) {
        return userRepo.findById(userId).map(UserEntity::getName).orElse("User " + userId);
    }

    private void publishAfterCommit(Runnable event) {
        AfterCommitExecutor.run(event);
    }

    private void publishTransferTurnChanged(long leagueId) {
        publishAfterCommit(() -> lifecycleEvents.publishEvent(new TransferTurnChangedEvent(leagueId)));
    }

    private void publishLifecycleChanged(String reason) {
        publishAfterCommit(() -> lifecycleEvents.publishEvent(new LifecycleScheduleChangedEvent(reason)));
    }

    private void publishLeagueNotificationExcluding(
            long leagueId,
            java.util.Collection<Integer> excludedUserIds,
            com.fantasy.domain.notification.NotificationEvent notification) {
        publishAfterCommit(() -> lifecycleEvents.publishEvent(
                LeagueNotificationRequestedEvent.leagueExcluding(leagueId, excludedUserIds, notification)
        ));
    }

    private void publishUserNotification(long leagueId,
                                         int userId,
                                         com.fantasy.domain.notification.NotificationEvent notification) {
        publishAfterCommit(() -> lifecycleEvents.publishEvent(
                LeagueNotificationRequestedEvent.user(leagueId, userId, notification)
        ));
    }
}
