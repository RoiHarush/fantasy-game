package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Exceptions.FantasyTeamException;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerState;
import com.fantasy.domain.transfer.TransferPickEntity;
import com.fantasy.domain.transfer.TransferTurnManager;
import com.fantasy.domain.user.UserGameData;
import com.fantasy.dto.IRSignRequestDto;
import com.fantasy.dto.TransferRequestDto;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.PlayerRepository;
import com.fantasy.infrastructure.repositories.GameWeekRepository;
import com.fantasy.api.TransferWebSocketController;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import com.fantasy.domain.player.*;
import com.fantasy.domain.user.*;
import com.fantasy.infrastructure.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class TransferWindowService {

    private static final Logger log = LoggerFactory.getLogger(TransferWindowService.class);

    private final PlayerRepository playerRepo;
    private final GameWeekRepository gameWeekRepo;
    private final TransferService transferService;
    private final TransferWebSocketController webSocketController;

    private final UserGameDataRepository gameDataRepo;
    private final UserRepository userRepo;
    private final UserSquadRepository squadRepo;
    private final PlayerRegistry playerRegistry;

    private TransferTurnManager turnManager;
    private boolean activeWindow = false;
    private int currentGameWeekId = -1;

    public TransferWindowService(PlayerRepository playerRepo,
                                 GameWeekRepository gameWeekRepo,
                                 TransferService transferService,
                                 TransferWebSocketController webSocketController,
                                 UserGameDataRepository gameDataRepo,
                                 UserRepository userRepo,
                                 UserSquadRepository squadRepo,
                                 PlayerRegistry playerRegistry) {
        this.playerRepo = playerRepo;
        this.gameWeekRepo = gameWeekRepo;
        this.transferService = transferService;
        this.webSocketController = webSocketController;
        this.gameDataRepo = gameDataRepo;
        this.userRepo = userRepo;
        this.squadRepo = squadRepo;
        this.playerRegistry = playerRegistry;
    }

    @Transactional
    public void processTransfer(TransferRequestDto request) {
        transferService.makeTransfer(request);

        broadcastTransferDone(
                request.getUserId(),
                request.getPlayerOutId(),
                request.getPlayerInId()
        );
        endTurn();
    }

    @Transactional
    public void passTurn(int userId) {
        if (!activeWindow || turnManager == null) {
            throw new RuntimeException("Transfer window is not active");
        }

        if (turnManager.isIRRound()) {
            throw new RuntimeException("Cannot pass turn during IR round! You must pick a player.");
        }

        var currentUserId = turnManager.getCurrentUserId().orElse(-1);
        if (currentUserId != userId) {
            throw new RuntimeException("Not your turn to pass");
        }

        endTurn();
        broadcastPass(userId);
    }

    public void broadcastPass(int userId) {
        String userName = userRepo.findById(userId)
                .map(UserEntity::getName)
                .orElse("Unknown user");

        log.info("User {} ({}) passed their turn.", userName, userId);
        webSocketController.sendPassEvent(userId, userName);
    }

    @Transactional
    public void openTransferWindow(int gameWeekId) {
        if (activeWindow) {
            log.warn("Attempted to open transfer window for GW {}, but window is already active.", gameWeekId);
            return;
        }

        var gameWeek = gameWeekRepo.findById(gameWeekId)
                .orElseThrow(() -> new RuntimeException("GameWeek not found: " + gameWeekId));

        List<TransferPickEntity> order = gameWeek.getTransferOrder();
        if (order == null || order.isEmpty())
            throw new RuntimeException("Transfer order not defined for GW " + gameWeekId);

        List<Integer> eligibleForIRRound = findUsersEligibleForIR(order);
        this.turnManager = new TransferTurnManager(order, eligibleForIRRound);
        this.turnManager.startWindow();
        this.currentGameWeekId = gameWeekId;
        this.activeWindow = true;

        int firstUser = turnManager.getCurrentUserId().orElse(-1);

        log.info("Transfer window OPENED for GW {} | First turn: UserID {}", gameWeekId, firstUser);
        if (!eligibleForIRRound.isEmpty()) {
            log.info("Users eligible for IR round: {}", eligibleForIRRound);
        }

        webSocketController.sendWindowOpenedEvent(
                firstUser,
                turnManager.getInitialOrder(),
                turnManager.getCurrentOrder(),
                turnManager.getTurnsUsed(),
                turnManager.getUserTotalTurns()
        );
    }

    private List<Integer> findUsersEligibleForIR(List<TransferPickEntity> order) {
        List<Integer> eligible = new ArrayList<>();
        if (order == null || order.isEmpty()) return eligible;

        int halfSize = order.size() / 2;

        for (int i = 0; i < halfSize; i++) {
            TransferPickEntity pick = order.get(i);
            int userId = pick.getUserId();

            Optional<UserGameDataEntity> gameDataEntityOpt = gameDataRepo.findByUserId(userId);
            if (gameDataEntityOpt.isEmpty()) continue;

            UserGameData user = UserMapper.toDomainGameData(gameDataEntityOpt.get(), playerRegistry);

            if (user == null || user.getNextFantasyTeam() == null) continue;

            var squad = user.getNextFantasyTeam().getSquad();
            if (squad == null) continue;

            boolean hasIR = Boolean.TRUE.equals(user.getActiveChips().get("IR"));
            boolean missingPlayer = squad.getAllPlayers().size() < 15;
            boolean benchFree = squad.getBench().get("S3") == null || squad.getBench().get("GK") == null;

            if (hasIR && missingPlayer && benchFree) {
                eligible.add(userId);
            }
        }

        return eligible;
    }

    @Transactional
    public void replaceIRPlayer(IRSignRequestDto request) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(request.getUserId())
                .orElseThrow(() -> new FantasyTeamException("UserGameData entity not found"));
        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        var squad = user.getNextFantasyTeam().getSquad();
        if (squad == null) throw new FantasyTeamException("Squad not found");

        var player = playerRegistry.findById(request.getPlayerId());

        if (player == null) throw new FantasyTeamException("Player not found");
        if (!player.getState().equals(PlayerState.NONE))
            throw new FantasyTeamException("Player not available");

        if (player.getPosition().equals(PlayerPosition.GOALKEEPER) && squad.getBench().get("GK") != null)
            throw new FantasyTeamException("Bench slot GK is already taken");

        if (!player.getPosition().equals(PlayerPosition.GOALKEEPER) && squad.getBench().get("S3") != null)
            throw new FantasyTeamException("Bench slot S3 is already taken");

        if (squad.getAllPlayers().size() >= 15)
            throw new FantasyTeamException("Squad already has 15 players");

        var ir = squad.getIR();
        if (ir == null) throw new FantasyTeamException("UserGameData has no IR slot active");
        if (ir.getPosition() != player.getPosition())
            throw new FantasyTeamException("Player position must match IR position");

        squad.replaceIR(player);
        player.setState(PlayerState.BENCH);
        player.setOwnerId(user.getId());

        PlayerEntity playerEntity = playerRepo.findById(player.getId())
                .orElseThrow(() -> new RuntimeException("Player entity not found"));
        playerEntity.setState(player.getState());
        playerEntity.setOwnerId(player.getOwnerId());
        playerRepo.save(playerEntity);

        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();
        if (nextSquadEntity == null) throw new FantasyTeamException("Next squad entity not found");

        UserSquadEntity updatedEntity = SquadMapper.toEntity(squad, nextSquadEntity.getGameweek());
        updatedEntity.setId(nextSquadEntity.getId());
        updatedEntity.setUser(gameDataEntity);
        squadRepo.save(updatedEntity);

        String userName = userRepo.findById(request.getUserId())
                .map(UserEntity::getName)
                .orElse("Unknown user");

        log.info("IR Replacement: User {} signed {} ({})", userName, player.getViewName(), player.getId());

        webSocketController.sendTransferDoneEvent(user.getId(), player.getId(), userName);
        endTurn();
    }

    public void endTurn() {
        if (!activeWindow) {
            log.warn("Tried to end turn but window is not active");
            return;
        }

        turnManager.endTurn();

        if (!turnManager.isWindowOpen() || turnManager.getCurrentUserId().isEmpty()) {
            log.info("Transfer window FINISHED for GW {}", currentGameWeekId);
            closeWindow();
            return;
        }

        int nextUserId = turnManager.getCurrentUserId().orElse(-1);

        if (turnManager.isIRRound()) {
            List<Integer> irOrder = turnManager.getCurrentOrder();
            UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(nextUserId)
                    .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));
            UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

            Player player = user.getNextFantasyTeam().getSquad().getIR();

            log.info("IR Round Turn: UserID {}", nextUserId);
            webSocketController.sendIRTurnStartedEvent(
                    nextUserId,
                    player.getPosition().getCode(),
                    irOrder,
                    turnManager.getTurnsUsed()
            );
            return;
        }

        log.info("Next turn: UserID {}", nextUserId);
        webSocketController.sendTurnStartedEvent(
                nextUserId,
                turnManager.getCurrentOrder(),
                turnManager.isIRRound() ? "IR" : "REGULAR",
                turnManager.getTurnsUsed()
        );
    }

    public void closeWindow() {
        if (!activeWindow) return;

        turnManager.closeWindow();
        activeWindow = false;

        int nextGwId = currentGameWeekId + 1;
        var currentGw = gameWeekRepo.findById(currentGameWeekId).orElseThrow();
        var nextGw = gameWeekRepo.findById(nextGwId).orElseThrow();

        List<TransferPickEntity> currentOrder = currentGw.getTransferOrder();

        List<TransferPickEntity> nextOrder = nextGw.getTransferOrder();
        if (nextOrder != null && !nextOrder.isEmpty()) {
            log.warn("Next GW {} already has a transfer order defined. Skipping order generation.", nextGwId);
            webSocketController.sendWindowClosedEvent();
            return;
        }

        List<TransferPickEntity> newOrder = shiftOrder(currentOrder);
        for (TransferPickEntity pick : newOrder) pick.setGameWeek(nextGw);
        nextGw.getTransferOrder().addAll(newOrder);

        gameWeekRepo.saveAndFlush(nextGw);

        log.info("Window closed. Generated new order for GW {}: {}", nextGwId,
                newOrder.stream().map(TransferPickEntity::getUserId).toList());

        webSocketController.sendWindowClosedEvent();
    }

    public void broadcastTransferDone(int userId, int playerOutId, int playerInId) {
        String userName = userRepo.findById(userId)
                .map(UserEntity::getName)
                .orElse("Unknown user");

        log.info("Transfer: User {} swapped OUT: {} -> IN: {}", userName, playerOutId, playerInId);
        webSocketController.sendTransferDoneEvent(userId, playerOutId, playerInId, userName);
    }

    private List<TransferPickEntity> shiftOrder(List<TransferPickEntity> order) {
        if (order == null || order.isEmpty()) return order;

        int half = order.size() / 2;
        List<Integer> baseUserIds = new ArrayList<>();
        for (int i = 0; i < half; i++) {
            baseUserIds.add(order.get(i).getUserId());
        }

        Integer first = baseUserIds.removeFirst();
        baseUserIds.add(first);

        List<TransferPickEntity> newOrder = new ArrayList<>();
        for (int i = 0; i < baseUserIds.size(); i++) {
            TransferPickEntity pick = new TransferPickEntity();
            pick.setPosition(i);
            pick.setUserId(baseUserIds.get(i));
            newOrder.add(pick);
        }

        for (int i = baseUserIds.size() - 1; i >= 0; i--) {
            TransferPickEntity pick = new TransferPickEntity();
            pick.setPosition(newOrder.size());
            pick.setUserId(baseUserIds.get(i));
            newOrder.add(pick);
        }

        for (int i = 0; i < newOrder.size(); i++) {
            newOrder.get(i).setPosition(i);
        }

        return newOrder;
    }

    public Map<String, Object> getCurrentWindowState() {
        Map<String, Object> state = new HashMap<>();
        state.put("isOpen", activeWindow);
        state.put("gameWeekId", currentGameWeekId);

        if (activeWindow && turnManager != null) {
            state.put("currentUserId", turnManager.getCurrentUserId().orElse(null));
            state.put("currentRound", turnManager.isIRRound() ? "IR" : "REGULAR");
            state.put("order", turnManager.getCurrentOrder());
            state.put("initialOrder", turnManager.getInitialOrder());
            state.put("turnsUsed", turnManager.getTurnsUsed());
            state.put("totalTurns", turnManager.getUserTotalTurns());
        } else {
            state.put("currentUserId", null);
            state.put("currentRound", null);
            state.put("order", null);
            state.put("initialOrder", null);
            state.put("turnsUsed", null);
            state.put("maxTurns", null);
        }

        return state;
    }

    public boolean isActiveWindow() {
        return activeWindow;
    }

    public Optional<Integer> getCurrentUserId() {
        return turnManager != null ? turnManager.getCurrentUserId() : Optional.empty();
    }
}