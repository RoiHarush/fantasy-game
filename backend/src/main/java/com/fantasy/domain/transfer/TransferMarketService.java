package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.player.*;
import com.fantasy.domain.team.*;
import com.fantasy.domain.team.Exceptions.FantasyTeamException;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserMapper;
import com.fantasy.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransferMarketService {

    private static final Logger log = LoggerFactory.getLogger(TransferMarketService.class);

    private final PlayerRepository playerRepo;
    private final GameWeekRepository gameWeekRepo;
    private final GameWeekService gameWeekService;
    private final UserSquadRepository squadRepo;
    private final UserGameDataRepository gameDataRepo;
    private final UserRepository userRepo;
    private final PlayerRegistry playerRegistry;
    private final TransferWebSocketController webSocketController;

    private TransferTurnManager turnManager;
    private boolean activeWindow = false;
    private int currentGameWeekId = -1;

    public TransferMarketService(PlayerRepository playerRepo,
                                 GameWeekRepository gameWeekRepo,
                                 GameWeekService gameWeekService,
                                 UserSquadRepository squadRepo,
                                 UserGameDataRepository gameDataRepo,
                                 UserRepository userRepo,
                                 PlayerRegistry playerRegistry,
                                 TransferWebSocketController webSocketController) {
        this.playerRepo = playerRepo;
        this.gameWeekRepo = gameWeekRepo;
        this.gameWeekService = gameWeekService;
        this.squadRepo = squadRepo;
        this.gameDataRepo = gameDataRepo;
        this.userRepo = userRepo;
        this.playerRegistry = playerRegistry;
        this.webSocketController = webSocketController;
    }

    @Transactional
    public void openTransferWindow(int gameWeekId) {
        if (activeWindow) {
            log.warn("Attempted to open transfer window for GW {}, but window is already active.", gameWeekId);
            return;
        }

        var gameWeek = gameWeekRepo.findById(gameWeekId)
                .orElseThrow(() -> new RuntimeException("GameWeek not found: " + gameWeekId));

        if (gameWeek.isTransferWindowProcessed()) {
            log.warn("Transfer window for GW {} was already processed.", gameWeekId);
            return;
        }

        List<TransferPickEntity> order = gameWeek.getTransferOrder();
        if (order == null || order.isEmpty())
            throw new RuntimeException("Transfer order not defined for GW " + gameWeekId);

        List<Integer> eligibleForIRRound = findUsersEligibleForIR(order);

        this.turnManager = new TransferTurnManager(order, eligibleForIRRound);
        this.turnManager.startWindow();
        this.currentGameWeekId = gameWeekId;
        this.activeWindow = true;

        gameWeek.setTransferWindowProcessed(true);
        gameWeekRepo.save(gameWeek);

        int firstUser = turnManager.getCurrentUserId().orElse(-1);

        log.info("Transfer window OPENED for GW {} | First turn: UserID {}", gameWeekId, firstUser);

        webSocketController.sendWindowOpenedEvent(
                firstUser,
                turnManager.getInitialOrder(),
                turnManager.getCurrentOrder(),
                turnManager.getTurnsUsed(),
                turnManager.getUserTotalTurns()
        );
    }

    public void passTurn(int userId) {
        validateTurn(userId);

        if (turnManager.isIRRound()) {
            throw new RuntimeException("Cannot pass turn during IR round! You must pick a player.");
        }

        endTurn();

        String userName = getUserName(userId);
        webSocketController.sendPassEvent(userId, userName);
    }

    public void closeWindow() {
        if (!activeWindow) return;

        turnManager.closeWindow();
        activeWindow = false;

        generateNextWeekOrder();

        webSocketController.sendWindowClosedEvent();
        log.info("Transfer window CLOSED for GW {}", currentGameWeekId);
    }


    @Transactional
    public void processTransfer(TransferRequestDto request) {
        validateTurn(request.getUserId());

        performTransfer(request.getUserId(), request.getPlayerOutId(), request.getPlayerInId());

        String userName = getUserName(request.getUserId());
        webSocketController.sendTransferDoneEvent(request.getUserId(), request.getPlayerOutId(), request.getPlayerInId(), userName);

        endTurn();
    }

    @Transactional
    public void replaceIRPlayer(IRSignRequestDto request) {
        if (!activeWindow) throw new RuntimeException("Window closed");
        if (!turnManager.isIRRound()) throw new RuntimeException("Not IR round");

        validateTurn(request.getUserId());

        performIRReplacement(request.getUserId(), request.getPlayerId());

        String userName = getUserName(request.getUserId());
        webSocketController.sendTransferDoneEvent(request.getUserId(), request.getPlayerId(), userName); // Send only IN player for IR sign

        endTurn();
    }

    private void performTransfer(int userId, int playerOutId, int playerInId) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));

        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);
        FantasyTeam team = user.getNextFantasyTeam();

        if (team == null) throw new RuntimeException("UserGameData has no next fantasy team");

        Player playerOut = playerRegistry.findById(playerOutId);
        Player playerIn = playerRegistry.findById(playerInId);

        if (playerOut == null || playerIn == null) throw new RuntimeException("Player not found");

        try {
            team.makeTransfer(playerIn, playerOut);
        } catch (FantasyTeamException e) {
            log.warn("Transfer failed for user {}: {}", userId, e.getMessage());
            throw e;
        }

        updatePlayerInDb(playerIn);
        updatePlayerInDb(playerOut);

        saveSquadToDb(gameDataEntity, team);

        log.info("Transfer completed: User {} | Out: {} -> In: {}", userId, playerOut.getViewName(), playerIn.getViewName());
    }

    private void performIRReplacement(int userId, int playerId) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new FantasyTeamException("UserGameData entity not found"));
        UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

        var squad = user.getNextFantasyTeam().getSquad();
        if (squad == null) throw new FantasyTeamException("Squad not found");

        var player = playerRegistry.findById(playerId);
        if (player == null) throw new FantasyTeamException("Player not found");

        if (!player.getState().equals(PlayerState.NONE)) throw new FantasyTeamException("Player not available");

        if (player.getPosition().equals(PlayerPosition.GOALKEEPER) && squad.getBench().get("GK") != null)
            throw new FantasyTeamException("Bench slot GK is already taken");
        if (!player.getPosition().equals(PlayerPosition.GOALKEEPER) && squad.getBench().get("S3") != null)
            throw new FantasyTeamException("Bench slot S3 is already taken");
        if (squad.getAllPlayers().size() >= 15)
            throw new FantasyTeamException("Squad already has 15 players");

        var ir = squad.getIR();
        if (ir == null) throw new FantasyTeamException("UserGameData has no IR slot active");
        if (ir.getPosition() != player.getPosition()) throw new FantasyTeamException("Player position must match IR position");

        squad.replaceIR(player);
        player.setState(PlayerState.BENCH);
        player.setOwnerId(user.getId());

        updatePlayerInDb(player);
        saveSquadToDb(gameDataEntity, user.getNextFantasyTeam());

        log.info("IR Replacement completed: User {} signed {}", userId, player.getViewName());
    }

    private void endTurn() {
        turnManager.endTurn();

        if (!turnManager.isWindowOpen() || turnManager.getCurrentUserId().isEmpty()) {
            closeWindow();
            return;
        }

        int nextUserId = turnManager.getCurrentUserId().get();

        if (turnManager.isIRRound()) {
            UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(nextUserId).orElseThrow();
            UserGameData user = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);
            Player irPlayer = user.getNextFantasyTeam().getSquad().getIR();

            String irPosCode = (irPlayer != null) ? irPlayer.getPosition().getCode() : "UNKNOWN";

            webSocketController.sendIRTurnStartedEvent(
                    nextUserId,
                    irPosCode,
                    turnManager.getCurrentOrder(),
                    turnManager.getTurnsUsed()
            );
        } else {
            webSocketController.sendTurnStartedEvent(
                    nextUserId,
                    turnManager.getCurrentOrder(),
                    "REGULAR",
                    turnManager.getTurnsUsed()
            );
        }
    }

    private void validateTurn(int userId) {
        if (!activeWindow) throw new RuntimeException("Transfer window is not active");

        int currentUserId = turnManager.getCurrentUserId().orElse(-1);
        if (currentUserId != userId) {
            throw new RuntimeException("Not your turn! Current turn is: " + currentUserId);
        }
    }

    @Transactional
    public void setManualTurnOrder(int gwId, TurnOrderDto dto) {
        var gameWeek = gameWeekRepo.findById(gwId)
                .orElseThrow(() -> new RuntimeException("GameWeek not found: " + gwId));

        List<TransferPickEntity> newList = new ArrayList<>();
        if (dto.getOrder() != null) {
            for (int i = 0; i < dto.getOrder().size(); i++) {
                TransferPickEntity pick = new TransferPickEntity();
                pick.setUserId(dto.getOrder().get(i));
                pick.setPosition(i);
                pick.setGameWeek(gameWeek);
                newList.add(pick);
            }
        }

        if (gameWeek.getTransferOrder() == null) {
            gameWeek.setTransferOrder(new ArrayList<>());
        }
        gameWeek.getTransferOrder().clear();
        gameWeek.getTransferOrder().addAll(newList);

        gameWeekRepo.save(gameWeek);
    }

    public List<Integer> getCurrentTurnOrder(int gwId) {
        var gameWeek = gameWeekRepo.findById(gwId)
                .orElseThrow(() -> new RuntimeException("GameWeek not found: " + gwId));

        if (gameWeek.getTransferOrder() == null) {
            return new ArrayList<>();
        }

        return gameWeek.getTransferOrder().stream()
                .sorted(Comparator.comparingInt(TransferPickEntity::getPosition))
                .map(TransferPickEntity::getUserId)
                .collect(Collectors.toList());
    }

    private void updatePlayerInDb(Player player) {
        PlayerEntity entity = playerRepo.findById(player.getId())
                .orElseThrow(() -> new RuntimeException("Player not found in DB"));
        entity.setOwnerId(player.getOwnerId());
        entity.setState(player.getState());
        playerRepo.save(entity);
    }

    private void saveSquadToDb(UserGameDataEntity gameDataEntity, FantasyTeam team) {
        int nextGw = gameWeekService.getNextGameweek().getId();
        UserSquadEntity nextSquadEntity = gameDataEntity.getNextSquad();

        if (nextSquadEntity == null || nextSquadEntity.getGameweek() != nextGw) {
            throw new RuntimeException("Squad for next game-week doesn't exist!");
        }

        List<Integer> newStartingLineup = team.getSquad().getStartingLineup().values().stream()
                .flatMap(List::stream)
                .map(Player::getId)
                .collect(Collectors.toCollection(ArrayList::new));
        nextSquadEntity.setStartingLineup(newStartingLineup);

        Map<String, Integer> benchMap = team.getSquad().getBench().entrySet().stream()
                .filter(e -> e.getValue() != null)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().getId(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
        nextSquadEntity.setBenchMap(new LinkedHashMap<>(benchMap));

        Map<String, Integer> formation = new LinkedHashMap<>();
        formation.put("GK", team.getSquad().getStartingLineup().get(PlayerPosition.GOALKEEPER).size());
        formation.put("DEF", team.getSquad().getStartingLineup().get(PlayerPosition.DEFENDER).size());
        formation.put("MID", team.getSquad().getStartingLineup().get(PlayerPosition.MIDFIELDER).size());
        formation.put("FWD", team.getSquad().getStartingLineup().get(PlayerPosition.FORWARD).size());
        nextSquadEntity.setFormation(new LinkedHashMap<>(formation));

        nextSquadEntity.setCaptainId(team.getSquad().getCaptain().getId());
        nextSquadEntity.setViceCaptainId(team.getSquad().getViceCaptain().getId());

        squadRepo.save(nextSquadEntity);
    }

    private void generateNextWeekOrder() {
        int nextGwId = currentGameWeekId + 1;

        var currentGwOpt = gameWeekRepo.findById(currentGameWeekId);
        var nextGwOpt = gameWeekRepo.findById(nextGwId);

        if (currentGwOpt.isEmpty() || nextGwOpt.isEmpty()) return;

        GameWeekEntity nextGw = nextGwOpt.get();
        if (nextGw.getTransferOrder() != null && !nextGw.getTransferOrder().isEmpty()) {
            log.warn("Next GW {} already has transfer order. Skipping.", nextGwId);
            return;
        }

        List<TransferPickEntity> currentOrder = currentGwOpt.get().getTransferOrder();
        List<TransferPickEntity> newOrder = shiftOrder(currentOrder, nextGw);

        nextGw.getTransferOrder().addAll(newOrder);
        gameWeekRepo.saveAndFlush(nextGw);

        log.info("Generated snake order for GW {}", nextGwId);
    }

    private List<TransferPickEntity> shiftOrder(List<TransferPickEntity> order, GameWeekEntity nextGw) {
        if (order == null || order.isEmpty()) return new ArrayList<>();

        int half = order.size() / 2;
        List<Integer> baseUserIds = new ArrayList<>();
        for (int i = 0; i < half; i++) {
            baseUserIds.add(order.get(i).getUserId());
        }

        if (!baseUserIds.isEmpty()) {
            Integer first = baseUserIds.removeFirst();
            baseUserIds.add(first);
        }

        List<TransferPickEntity> newOrder = new ArrayList<>();

        for (int i = 0; i < baseUserIds.size(); i++) {
            TransferPickEntity pick = new TransferPickEntity();
            pick.setPosition(i);
            pick.setUserId(baseUserIds.get(i));
            pick.setGameWeek(nextGw);
            newOrder.add(pick);
        }

        for (int i = baseUserIds.size() - 1; i >= 0; i--) {
            TransferPickEntity pick = new TransferPickEntity();
            pick.setPosition(newOrder.size());
            pick.setUserId(baseUserIds.get(i));
            pick.setGameWeek(nextGw);
            newOrder.add(pick);
        }

        return newOrder;
    }

    private List<Integer> findUsersEligibleForIR(List<TransferPickEntity> order) {
        List<Integer> eligible = new ArrayList<>();
        if (order == null) return eligible;

        Set<Integer> checkedUsers = new HashSet<>();

        for (TransferPickEntity pick : order) {
            int userId = pick.getUserId();
            if (checkedUsers.contains(userId)) continue;
            checkedUsers.add(userId);

            Optional<UserGameDataEntity> gameDataOpt = gameDataRepo.findByUserId(userId);
            if (gameDataOpt.isEmpty()) continue;

            UserGameData user = UserMapper.toDomainGameData(gameDataOpt.get(), playerRegistry);
            if (user.getNextFantasyTeam() == null || user.getNextFantasyTeam().getSquad() == null) continue;

            var squad = user.getNextFantasyTeam().getSquad();

            boolean hasIR = Boolean.TRUE.equals(user.getActiveChips().get("IR"));
            boolean missingPlayer = squad.getAllPlayers().size() < 15;
            boolean benchFree = squad.getBench().get("S3") == null || squad.getBench().get("GK") == null;

            if (hasIR && missingPlayer && benchFree) {
                eligible.add(userId);
            }
        }
        return eligible;
    }

    private String getUserName(int userId) {
        return userRepo.findById(userId).map(UserEntity::getName).orElse("User " + userId);
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
            state.put("totalTurns", null);
        }
        return state;
    }
}