package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.GameweekActivityPolicy;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.time.LocalDateTime;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TransferMarketServicePersistenceTest {

    @Test
    void finalDraftPickCreatesAValidLineupAndActivatesTheLeague() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverPreferenceRepo = mock(WaiverPreferenceRepository.class);
        LeagueTransferActionRepository actionRepo = mock(LeagueTransferActionRepository.class);
        TransferWebSocketController webSocket = mock(TransferWebSocketController.class);
        TransferMarketService service = new TransferMarketService(
                playerRepo, gameWeekRepo, squadRepo, gameDataRepo, userRepo, leagueRepo,
                leagueAccess, windowRepo, waiverPreferenceRepo, mock(WaiverPlanProgressRepository.class), actionRepo, webSocket,
                mock(SupplementalDraftPoolService.class),
                mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        league.setStatus(LeagueStatus.DRAFT_LIVE);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(1);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setWindowType(TransferWindowType.DRAFT);
        window.setTurnOrder(List.of(10));
        window.open(List.of());

        UserEntity user = new UserEntity();
        user.setId(10);
        user.setName("Manager");
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(new ArrayList<>(List.of(
                1,
                3, 4, 5, 6, 7,
                8, 9, 10, 11, 12,
                13, 14, 15
        )));
        squad.setBenchMap(new LinkedHashMap<>());
        squad.setFirstPickId(1);
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setLeague(league);
        gameData.setUser(user);
        gameData.setNextSquad(squad);

        List<PlayerEntity> players = new ArrayList<>();
        players.add(player(1, PlayerPosition.GOALKEEPER, 1));
        players.add(player(2, PlayerPosition.GOALKEEPER, 2));
        IntStream.rangeClosed(3, 7).forEach(id -> players.add(player(id, PlayerPosition.DEFENDER, id)));
        IntStream.rangeClosed(8, 12).forEach(id -> players.add(player(id, PlayerPosition.MIDFIELDER, id)));
        IntStream.rangeClosed(13, 15).forEach(id -> players.add(player(id, PlayerPosition.FORWARD, id)));

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(gameData));
        when(gameDataRepo.findAllByLeagueIdWithSquads(7L)).thenReturn(List.of(gameData));
        when(playerRepo.findById(2)).thenReturn(Optional.of(players.get(1)));
        when(playerRepo.findAllById(any())).thenAnswer(invocation -> {
            Set<Integer> ids = new java.util.HashSet<>();
            invocation.<Iterable<Integer>>getArgument(0).forEach(ids::add);
            return players.stream().filter(player -> ids.contains(player.getId())).toList();
        });
        when(userRepo.findById(10)).thenReturn(Optional.of(user));
        when(gameWeekRepo.findById(2)).thenReturn(Optional.empty());

        service.processDraftPick(10, 2);

        assertEquals(LeagueStatus.ACTIVE, league.getStatus());
        assertEquals(11, squad.getStartingLineup().size());
        assertEquals(4, squad.getBenchMap().size());
        assertEquals(1, squad.getFormation().get("GK"));
        assertEquals(3, squad.getFormation().get("DEF"));
        assertEquals(4, squad.getFormation().get("MID"));
        assertEquals(3, squad.getFormation().get("FWD"));
        assertNotEquals(squad.getFirstPickId(), squad.getCaptainId());
        assertNotEquals(squad.getFirstPickId(), squad.getViceCaptainId());
        verify(webSocket).sendTransferDoneEvent(7L, 10, 2, "Manager");
        verify(webSocket).sendWindowClosedEvent(7L);
        verify(actionRepo).save(any(LeagueTransferActionEntity.class));
    }

    @Test
    void transferAdvancesPersistedWindowWithoutMutatingGlobalPlayerOwnership() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverPreferenceRepo = mock(WaiverPreferenceRepository.class);
        LeagueTransferActionRepository actionRepo = mock(LeagueTransferActionRepository.class);
        TransferWebSocketController webSocket = mock(TransferWebSocketController.class);

        TransferMarketService service = new TransferMarketService(
                playerRepo,
                gameWeekRepo,
                squadRepo,
                gameDataRepo,
                userRepo,
                leagueRepo,
                leagueAccess,
                windowRepo,
                waiverPreferenceRepo,
                mock(WaiverPlanProgressRepository.class),
                actionRepo,
                webSocket,
                mock(SupplementalDraftPoolService.class),
                mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(1);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setTurnOrder(List.of(10));
        window.open(List.of());

        UserEntity user = new UserEntity();
        user.setId(10);
        user.setName("Manager");
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(List.of(100));
        squad.setBenchMap(new LinkedHashMap<>());
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setLeague(league);
        gameData.setUser(user);
        gameData.setNextSquad(squad);

        PlayerEntity outgoing = player(100, PlayerPosition.DEFENDER, 1);
        PlayerEntity incoming = player(200, PlayerPosition.DEFENDER, 2);
        TransferRequestDto request = new TransferRequestDto();
        request.setUserId(10);
        request.setPlayerOutId(100);
        request.setPlayerInId(200);

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(gameData));
        when(gameDataRepo.findAllByLeagueIdWithSquads(7L)).thenReturn(List.of(gameData));
        when(playerRepo.findById(100)).thenReturn(Optional.of(outgoing));
        when(playerRepo.findById(200)).thenReturn(Optional.of(incoming));
        when(playerRepo.findAllById(any())).thenReturn(List.of(incoming));
        when(userRepo.findById(10)).thenReturn(Optional.of(user));
        when(gameWeekRepo.findById(2)).thenReturn(Optional.empty());

        service.processTransfer(request);

        assertEquals(List.of(200), squad.getStartingLineup());
        assertEquals(TransferWindowStatus.CLOSED, window.getStatus());
        verify(squadRepo).save(squad);
        verify(windowRepo).saveAndFlush(window);
        verify(playerRepo, never()).save(any(PlayerEntity.class));
        verify(webSocket).sendTransferDoneEvent(7L, 10, 100, 200, "Manager");
        verify(webSocket).sendWindowClosedEvent(7L);
        verify(actionRepo).save(any(LeagueTransferActionEntity.class));
        assertFalse(window.currentUserId().isPresent());
    }

    @Test
    void supplementalDraftAllowsAReplacementAndReleasesUnpickedArrivalsWhenItEnds() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverPreferenceRepo = mock(WaiverPreferenceRepository.class);
        LeagueTransferActionRepository actionRepo = mock(LeagueTransferActionRepository.class);
        TransferWebSocketController webSocket = mock(TransferWebSocketController.class);
        SupplementalDraftPoolService poolService = mock(SupplementalDraftPoolService.class);
        TransferMarketService service = new TransferMarketService(
                playerRepo, gameWeekRepo, squadRepo, gameDataRepo, userRepo, leagueRepo,
                leagueAccess, windowRepo, waiverPreferenceRepo, mock(WaiverPlanProgressRepository.class), actionRepo, webSocket,
                poolService,
                mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        league.setStatus(LeagueStatus.ACTIVE);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(20);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setWindowType(TransferWindowType.SUPPLEMENTAL);
        window.setTurnOrder(List.of(10));
        window.open(List.of());

        UserEntity user = new UserEntity();
        user.setId(10);
        user.setName("Manager");
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(List.of(100));
        squad.setBenchMap(new LinkedHashMap<>());
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setLeague(league);
        gameData.setUser(user);
        gameData.setNextSquad(squad);

        PlayerEntity outgoing = player(100, PlayerPosition.DEFENDER, 1);
        PlayerEntity newArrival = player(501, PlayerPosition.DEFENDER, 2);
        TransferRequestDto request = new TransferRequestDto();
        request.setUserId(10);
        request.setPlayerOutId(100);
        request.setPlayerInId(501);

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(windowRepo.findFirstByLeague_IdAndStatusOrderByOpenedAtDesc(7L, TransferWindowStatus.OPEN))
                .thenReturn(Optional.of(window));
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(gameData));
        when(gameDataRepo.findAllByLeagueIdWithSquads(7L)).thenReturn(List.of(gameData));
        when(playerRepo.findById(100)).thenReturn(Optional.of(outgoing));
        when(playerRepo.findById(501)).thenReturn(Optional.of(newArrival));
        when(playerRepo.findAllById(any())).thenReturn(List.of(newArrival));
        when(userRepo.findById(10)).thenReturn(Optional.of(user));

        service.processTransfer(request);

        assertEquals(List.of(501), squad.getStartingLineup());
        assertEquals(TransferWindowStatus.CLOSED, window.getStatus());
        verify(poolService).requireEligibleAt(7L, 501, window.getOpenedAt());
        verify(poolService).releaseEligiblePool(7L, window.getOpenedAt());
        verify(webSocket).sendWindowClosedEvent(7L);
        ArgumentCaptor<LeagueTransferActionEntity> actionCaptor =
                ArgumentCaptor.forClass(LeagueTransferActionEntity.class);
        verify(actionRepo).save(actionCaptor.capture());
        assertEquals(TransferActionSource.DRAFT, actionCaptor.getValue().getSource());
        assertEquals(TransferWindowType.SUPPLEMENTAL, actionCaptor.getValue().getWindowType());
    }

    @Test
    void completedLegacyDraftStillSuppliesTheFirstTransferOrder() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverPreferenceRepo = mock(WaiverPreferenceRepository.class);
        LeagueTransferActionRepository actionRepo = mock(LeagueTransferActionRepository.class);
        TransferWebSocketController webSocket = mock(TransferWebSocketController.class);
        TransferMarketService service = new TransferMarketService(
                playerRepo, gameWeekRepo, squadRepo, gameDataRepo, userRepo, leagueRepo,
                leagueAccess, windowRepo, waiverPreferenceRepo, mock(WaiverPlanProgressRepository.class), actionRepo, webSocket,
                mock(SupplementalDraftPoolService.class),
                mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        LeagueTransferWindowEntity completedDraft = new LeagueTransferWindowEntity();
        completedDraft.setWindowType(TransferWindowType.DRAFT);
        completedDraft.setTurnOrder(List.of(10, 20, 30));
        completedDraft.open(List.of());
        completedDraft.close();

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                7L, 2, TransferWindowType.TRANSFER
        )).thenReturn(Optional.empty());
        when(windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                7L, 1, TransferWindowType.DRAFT
        )).thenReturn(Optional.of(completedDraft));

        assertEquals(List.of(30, 20, 10, 10, 20, 30), service.getCurrentTurnOrder(10, 2));
    }

    @Test
    void tradedPicksAllowUnevenOwnershipButKeepTheCanonicalOrderImmutable() {
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        TransferMarketService service = new TransferMarketService(
                mock(PlayerRepository.class), gameWeekRepo, mock(UserSquadRepository.class),
                mock(UserGameDataRepository.class), mock(UserRepository.class), leagueRepo,
                mock(LeagueAccessService.class), windowRepo, mock(WaiverPreferenceRepository.class),
                mock(WaiverPlanProgressRepository.class), mock(LeagueTransferActionRepository.class),
                mock(TransferWebSocketController.class),
                mock(SupplementalDraftPoolService.class),
                mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        UserEntity firstUser = new UserEntity();
        firstUser.setId(10);
        UserEntity secondUser = new UserEntity();
        secondUser.setId(20);
        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        league.setUsers(List.of(firstUser, secondUser));
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setWindowType(TransferWindowType.TRANSFER);
        window.setTurnOrder(List.of(10, 20, 20, 10));
        window.setCanonicalOrder(List.of(10, 20, 20, 10));
        TurnOrderDto tradedOrder = new TurnOrderDto();
        tradedOrder.setOrder(List.of(10, 10, 10, 20));

        when(leagueRepo.findByIdWithLock(7L)).thenReturn(Optional.of(league));
        when(gameWeekRepo.findById(4)).thenReturn(Optional.of(gameWeek));
        when(windowRepo.findConfiguredWindowForUpdate(7L, 4, TransferWindowType.TRANSFER))
                .thenReturn(Optional.of(window));

        service.setManualTurnOrderForLeague(7L, 4, tradedOrder);

        assertEquals(List.of(10, 10, 10, 20), window.getTurnOrder());
        assertEquals(List.of(10, 20, 20, 10), window.getCanonicalOrder());
        verify(windowRepo).save(window);
    }

    @Test
    void nextGameweekOrderIsDerivedFromCanonicalOrderInsteadOfTradedOrder() {
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        TransferMarketService service = new TransferMarketService(
                mock(PlayerRepository.class), gameWeekRepo, mock(UserSquadRepository.class),
                mock(UserGameDataRepository.class), mock(UserRepository.class), mock(LeagueRepository.class),
                mock(LeagueAccessService.class), windowRepo, mock(WaiverPreferenceRepository.class),
                mock(WaiverPlanProgressRepository.class), mock(LeagueTransferActionRepository.class),
                mock(TransferWebSocketController.class),
                mock(SupplementalDraftPoolService.class),
                mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        GameWeekEntity currentGameWeek = new GameWeekEntity();
        currentGameWeek.setId(4);
        GameWeekEntity nextGameWeek = new GameWeekEntity();
        nextGameWeek.setId(5);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(currentGameWeek);
        window.setWindowType(TransferWindowType.TRANSFER);
        window.setTurnOrder(List.of(10, 10, 10, 20));
        window.setCanonicalOrder(List.of(
                10, 20, 30, 40, 50, 60, 70,
                70, 60, 50, 40, 30, 20, 10
        ));
        window.open(List.of());

        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(gameWeekRepo.findById(5)).thenReturn(Optional.of(nextGameWeek));
        when(windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(7L, 5, TransferWindowType.TRANSFER))
                .thenReturn(Optional.empty());

        service.closeWindow(7L);

        ArgumentCaptor<LeagueTransferWindowEntity> captor =
                ArgumentCaptor.forClass(LeagueTransferWindowEntity.class);
        verify(windowRepo).save(captor.capture());
        LeagueTransferWindowEntity preparedNextWindow = captor.getValue();
        assertEquals(5, preparedNextWindow.getGameWeek().getId());
        List<Integer> expectedRotatedSnake = List.of(
                20, 30, 40, 50, 60, 70, 10,
                10, 70, 60, 50, 40, 30, 20
        );
        assertEquals(expectedRotatedSnake, preparedNextWindow.getTurnOrder());
        assertEquals(expectedRotatedSnake, preparedNextWindow.getCanonicalOrder());
    }

    @Test
    void transferringFirstPickCaptainConsumesChipAndChoosesAnotherStarter() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        TransferMarketService service = new TransferMarketService(
                playerRepo, gameWeekRepo, squadRepo, gameDataRepo, userRepo, leagueRepo,
                leagueAccess, windowRepo, mock(WaiverPreferenceRepository.class),
                mock(WaiverPlanProgressRepository.class), mock(LeagueTransferActionRepository.class),
                mock(TransferWebSocketController.class),
                mock(SupplementalDraftPoolService.class),
                mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setTurnOrder(List.of(10));
        window.setCanonicalOrder(List.of(10));
        window.open(List.of());
        UserEntity user = new UserEntity();
        user.setId(10);
        user.setName("Manager");
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(List.of(100, 101, 102));
        squad.setBenchMap(new LinkedHashMap<>());
        squad.setFirstPickId(100);
        squad.setCaptainId(100);
        squad.setViceCaptainId(101);
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setLeague(league);
        gameData.setUser(user);
        gameData.setNextSquad(squad);
        gameData.getActiveChips().put("FIRST_PICK_CAPTAIN", true);
        gameData.getChips().put("FIRST_PICK_CAPTAIN", 0);
        PlayerEntity outgoing = player(100, PlayerPosition.DEFENDER, 1);
        PlayerEntity incoming = player(200, PlayerPosition.DEFENDER, 2);
        PlayerEntity vice = player(101, PlayerPosition.DEFENDER, 3);
        PlayerEntity otherStarter = player(102, PlayerPosition.DEFENDER, 4);
        TransferRequestDto request = new TransferRequestDto();
        request.setUserId(10);
        request.setPlayerOutId(100);
        request.setPlayerInId(200);

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(gameData));
        when(gameDataRepo.findAllByLeagueIdWithSquads(7L)).thenReturn(List.of(gameData));
        when(playerRepo.findById(100)).thenReturn(Optional.of(outgoing));
        when(playerRepo.findById(200)).thenReturn(Optional.of(incoming));
        when(playerRepo.findAllById(any())).thenReturn(List.of(incoming, vice, otherStarter));
        when(userRepo.findById(10)).thenReturn(Optional.of(user));
        when(gameWeekRepo.findById(5)).thenReturn(Optional.empty());

        service.processTransfer(request);

        assertFalse(gameData.getActiveChips().get("FIRST_PICK_CAPTAIN"));
        assertEquals(0, gameData.getChips().get("FIRST_PICK_CAPTAIN"));
        assertNull(squad.getFirstPickId());
        assertEquals(101, squad.getViceCaptainId());
        assertTrue(List.of(200, 102).contains(squad.getCaptainId()));
        verify(gameDataRepo).save(gameData);
    }

    @Test
    void currentWindowStateIncludesLivePresenceAndPlannedAbsence() {
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        com.fantasy.config.WebSocketPresenceService presence =
                mock(com.fantasy.config.WebSocketPresenceService.class);
        TransferMarketService service = new TransferMarketService(
                mock(PlayerRepository.class), mock(GameWeekRepository.class), mock(UserSquadRepository.class),
                mock(UserGameDataRepository.class), mock(UserRepository.class), mock(LeagueRepository.class),
                leagueAccess, windowRepo, mock(WaiverPreferenceRepository.class),
                mock(WaiverPlanProgressRepository.class), mock(LeagueTransferActionRepository.class),
                mock(TransferWebSocketController.class), mock(SupplementalDraftPoolService.class), presence
        );

        UserEntity first = new UserEntity();
        first.setId(10);
        UserEntity second = new UserEntity();
        second.setId(20);
        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        league.setUsers(List.of(first, second));
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setWindowType(TransferWindowType.TRANSFER);
        window.setTurnOrder(List.of(10, 20));
        window.setAutomaticForUser(20, true);
        window.open(List.of());

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(windowRepo.findFirstByLeague_IdAndStatusOrderByOpenedAtDesc(7L, TransferWindowStatus.OPEN))
                .thenReturn(Optional.of(window));
        when(presence.onlineUserIds(List.of(10, 20))).thenReturn(List.of(10));

        var state = service.getCurrentWindowState(10);

        assertEquals(List.of(10), state.get("onlineUserIds"));
        assertEquals(Set.of(20), state.get("automaticUserIds"));
    }

    @Test
    void closedWindowStateStillIncludesLeaguePresence() {
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        com.fantasy.config.WebSocketPresenceService presence = mock(com.fantasy.config.WebSocketPresenceService.class);
        TransferMarketService service = new TransferMarketService(
                mock(PlayerRepository.class),
                mock(GameWeekRepository.class),
                mock(UserSquadRepository.class),
                mock(UserGameDataRepository.class),
                mock(UserRepository.class),
                leagueRepo,
                leagueAccess,
                windowRepo,
                mock(WaiverPreferenceRepository.class),
                mock(WaiverPlanProgressRepository.class),
                mock(LeagueTransferActionRepository.class),
                mock(TransferWebSocketController.class),
                mock(SupplementalDraftPoolService.class),
                presence
        );

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(windowRepo.findFirstByLeague_IdAndStatusOrderByOpenedAtDesc(7L, TransferWindowStatus.OPEN))
                .thenReturn(Optional.empty());
        when(leagueRepo.findUserIdsByLeagueId(7L)).thenReturn(List.of(10, 20));
        when(presence.onlineUserIds(List.of(10, 20))).thenReturn(List.of(10));
        when(presence.activeUserIds(List.of(10, 20))).thenReturn(List.of(10));

        var state = service.getCurrentWindowState(10);

        assertFalse((Boolean) state.get("isOpen"));
        assertEquals(List.of(10), state.get("onlineUserIds"));
        assertEquals(List.of(10), state.get("activeUserIds"));
    }

    @Test
    void attendanceStateDescribesEveryAbsentManagerAndACompletedWindow() {
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        TransferMarketService service = new TransferMarketService(
                mock(PlayerRepository.class), mock(GameWeekRepository.class), mock(UserSquadRepository.class),
                mock(UserGameDataRepository.class), mock(UserRepository.class), mock(LeagueRepository.class),
                leagueAccess, windowRepo, mock(WaiverPreferenceRepository.class),
                mock(WaiverPlanProgressRepository.class), mock(LeagueTransferActionRepository.class),
                mock(TransferWebSocketController.class), mock(SupplementalDraftPoolService.class),
                mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setWindowType(TransferWindowType.TRANSFER);
        window.setTurnOrder(List.of(10, 20));
        window.setAutomaticForUser(20, true);
        window.open(List.of());
        window.close();

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(7L, 4, TransferWindowType.TRANSFER))
                .thenReturn(Optional.of(window));

        var attendance = service.getAttendancePreference(10, 4);

        assertEquals(false, attendance.get("automatic"));
        assertEquals(Set.of(20), attendance.get("automaticUserIds"));
        assertEquals("CLOSED", attendance.get("windowStatus"));
    }

    @Test
    void administrativeReplacementUsesTheNormalOwnershipRulesAndRecordsTheCorrection() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        LeagueTransferActionRepository actionRepo = mock(LeagueTransferActionRepository.class);
        TransferWebSocketController webSocket = mock(TransferWebSocketController.class);
        SupplementalDraftPoolService poolService = mock(SupplementalDraftPoolService.class);
        TransferMarketService service = new TransferMarketService(
                playerRepo, gameWeekRepo, squadRepo, gameDataRepo, userRepo, leagueRepo,
                mock(LeagueAccessService.class), windowRepo, mock(WaiverPreferenceRepository.class),
                mock(WaiverPlanProgressRepository.class), actionRepo, webSocket,
                poolService,
                mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        UserEntity manager = new UserEntity();
        manager.setId(10);
        manager.setName("Manager");
        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        league.setUsers(List.of(manager));
        UserSquadEntity squad = new UserSquadEntity();
        squad.setGameweek(2);
        squad.setStartingLineup(new ArrayList<>(List.of(100)));
        squad.setBenchMap(new LinkedHashMap<>());
        squad.setCaptainId(100);
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setLeague(league);
        gameData.setUser(manager);
        gameData.setNextSquad(squad);
        PlayerEntity outgoing = player(100, PlayerPosition.DEFENDER, 1);
        outgoing.setViewName("Outgoing");
        PlayerEntity incoming = player(200, PlayerPosition.DEFENDER, 2);
        incoming.setViewName("Incoming");
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(2);

        when(leagueRepo.findByIdWithLock(7L)).thenReturn(Optional.of(league));
        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN)).thenReturn(List.of());
        when(gameWeekRepo.findAll()).thenReturn(List.of());
        when(gameWeekRepo.findById(2)).thenReturn(Optional.of(gameweek));
        when(gameDataRepo.findByUserIdForUpdate(10)).thenReturn(Optional.of(gameData));
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(gameData));
        when(gameDataRepo.findAllByLeagueIdWithSquads(7L)).thenReturn(List.of(gameData));
        when(playerRepo.findById(100)).thenReturn(Optional.of(outgoing));
        when(playerRepo.findById(200)).thenReturn(Optional.of(incoming));
        when(playerRepo.findAllById(any())).thenReturn(List.of(incoming));
        when(poolService.isEligible(7L, 200)).thenReturn(true);

        AdministrativePlayerReplacementResult result = service.replacePlayerAdministratively(
                7L, 10, 100, 200, 99
        );

        assertEquals(List.of(200), squad.getStartingLineup());
        assertEquals(200, squad.getCaptainId());
        assertEquals("Outgoing was replaced by Incoming.", result.message());
        ArgumentCaptor<LeagueTransferActionEntity> action = ArgumentCaptor.forClass(LeagueTransferActionEntity.class);
        verify(actionRepo).save(action.capture());
        assertEquals(TransferActionSource.ADMIN_CORRECTION, action.getValue().getSource());
        assertEquals(TransferWindowType.TRANSFER, action.getValue().getWindowType());
        verify(poolService).releasePlayer(7L, 200);
        verify(webSocket).sendTransferDoneEvent(7L, 10, 100, 200, "Manager");
    }

    @Test
    void administrativeReplacementOptionsIncludePlayersReservedForTheSupplementalDraft() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        SupplementalDraftPoolService poolService = mock(SupplementalDraftPoolService.class);
        TransferMarketService service = new TransferMarketService(
                playerRepo, gameWeekRepo, mock(UserSquadRepository.class), gameDataRepo,
                mock(UserRepository.class), leagueRepo, mock(LeagueAccessService.class), windowRepo,
                mock(WaiverPreferenceRepository.class), mock(WaiverPlanProgressRepository.class),
                mock(LeagueTransferActionRepository.class), mock(TransferWebSocketController.class),
                poolService, mock(com.fantasy.config.WebSocketPresenceService.class)
        );

        UserEntity manager = new UserEntity();
        manager.setId(10);
        manager.setName("Manager");
        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        UserSquadEntity squad = new UserSquadEntity();
        squad.setGameweek(2);
        squad.setStartingLineup(new ArrayList<>(List.of(100)));
        squad.setBenchMap(new LinkedHashMap<>());
        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setLeague(league);
        gameData.setUser(manager);
        gameData.setNextSquad(squad);
        PlayerEntity outgoing = player(100, PlayerPosition.GOALKEEPER, 1);
        outgoing.setViewName("Existing keeper");
        PlayerEntity newKeeper = player(200, PlayerPosition.GOALKEEPER, 2);
        newKeeper.setViewName("New keeper");

        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(gameData));
        when(gameDataRepo.findAllByLeagueIdWithSquads(7L)).thenReturn(List.of(gameData));
        when(gameWeekRepo.findAll()).thenReturn(List.of());
        when(playerRepo.findAllById(any())).thenReturn(List.of(outgoing));
        when(playerRepo.findAll()).thenReturn(List.of(outgoing, newKeeper));
        when(poolService.playerIds(7L)).thenReturn(Set.of(200));

        AdministrativePlayerReplacementOptions options = service
                .getAdministrativeReplacementOptions(7L, 10);

        assertTrue(options.allowed());
        assertEquals(List.of(200), options.availablePlayers().stream()
                .map(AdministrativePlayerReplacementOptions.PlayerOption::id)
                .toList());
        assertTrue(options.availablePlayers().getFirst().supplementalDraftReserved());
    }

    @Test
    void administrativeReplacementIsBlockedByAnOpenWindowOrLiveGameweek() {
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        TransferMarketService service = new TransferMarketService(
                mock(PlayerRepository.class), gameWeekRepo, mock(UserSquadRepository.class), gameDataRepo,
                mock(UserRepository.class), leagueRepo, mock(LeagueAccessService.class), windowRepo,
                mock(WaiverPreferenceRepository.class), mock(WaiverPlanProgressRepository.class),
                mock(LeagueTransferActionRepository.class), mock(TransferWebSocketController.class),
                mock(SupplementalDraftPoolService.class), mock(com.fantasy.config.WebSocketPresenceService.class)
        );
        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        when(leagueRepo.findByIdWithLock(7L)).thenReturn(Optional.of(league));
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(new LeagueTransferWindowEntity()))
                .thenReturn(List.of());

        assertThrows(IllegalStateException.class,
                () -> service.replacePlayerAdministratively(7L, 10, 100, 200, 99));
        verify(gameDataRepo, never()).findByUserIdForUpdate(10);

        GameWeekEntity liveGameweek = new GameWeekEntity();
        liveGameweek.setId(2);
        liveGameweek.setName("Gameweek 2");
        liveGameweek.setStatus("LIVE");
        liveGameweek.setCalculated(false);
        liveGameweek.setFirstKickoffTime(LocalDateTime.now().minusHours(1));
        when(gameWeekRepo.findAll()).thenReturn(List.of(liveGameweek));

        assertThrows(GameweekActivityPolicy.GameweekActiveException.class,
                () -> service.replacePlayerAdministratively(7L, 10, 100, 200, 99));
        verify(gameDataRepo, never()).findByUserIdForUpdate(10);
    }

    private PlayerEntity player(int id, PlayerPosition position, int teamId) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setPosition(position);
        player.setTeamId(teamId);
        return player;
    }
}
