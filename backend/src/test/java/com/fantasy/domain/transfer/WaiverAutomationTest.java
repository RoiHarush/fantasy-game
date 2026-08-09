package com.fantasy.domain.transfer;

import com.fantasy.config.WebSocketPresenceService;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
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

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WaiverAutomationTest {

    @Test
    void connectedUserKeepsManualControlAndWaiversAreNotExecuted() {
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverRepo = mock(WaiverPreferenceRepository.class);
        WebSocketPresenceService presence = mock(WebSocketPresenceService.class);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setTurnOrder(List.of(10, 11));
        window.open(List.of());

        TransferMarketService service = new TransferMarketService(
                mock(PlayerRepository.class), mock(GameWeekRepository.class), mock(UserSquadRepository.class),
                mock(UserGameDataRepository.class), mock(UserRepository.class), mock(LeagueRepository.class),
                mock(LeagueAccessService.class), windowRepo, waiverRepo, mock(WaiverPlanProgressRepository.class),
                mock(LeagueTransferActionRepository.class), presence, mock(TransferWebSocketController.class),
                mock(SupplementalDraftPoolService.class), 0
        );
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(presence.isOnline(10)).thenReturn(true);

        service.processOfflineTurn(7L);

        assertEquals(10, window.currentUserId().orElseThrow());
        verify(waiverRepo, never()).findByLeague_IdAndUser_IdAndGameWeek_IdAndPlanTypeOrderByPriorityAsc(
                7L, 10, 4, WaiverPlanType.REGULAR
        );
    }

    @Test
    void offlineTurnSkipsUnavailableFirstChoiceAndExecutesNextPreference() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverRepo = mock(WaiverPreferenceRepository.class);
        WaiverPlanProgressRepository progressRepo = mock(WaiverPlanProgressRepository.class);
        LeagueTransferActionRepository actionRepo = mock(LeagueTransferActionRepository.class);
        WebSocketPresenceService presence = mock(WebSocketPresenceService.class);
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
                waiverRepo,
                progressRepo,
                actionRepo,
                presence,
                webSocket,
                mock(SupplementalDraftPoolService.class),
                0
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setTurnOrder(List.of(10, 10));
        window.open(List.of());

        UserEntity user = user(10, "Offline Manager");
        UserGameDataEntity userData = gameData(league, user, squad(100));
        UserGameDataEntity otherData = gameData(league, user(11, "Other"), squad(300));
        PlayerEntity outgoing = player(100, PlayerPosition.DEFENDER, 1);
        PlayerEntity secondChoice = player(200, PlayerPosition.DEFENDER, 2);
        PlayerEntity unavailableFirstChoice = player(300, PlayerPosition.DEFENDER, 3);

        WaiverPreferenceEntity first = preference(league, user, gameWeek, 4, 300, 100);
        WaiverPreferenceEntity second = preference(league, user, gameWeek, 5, 200, 100);
        WaiverPlanProgressEntity progress = new WaiverPlanProgressEntity();
        progress.setNextPriority(4);

        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(presence.isOnline(10)).thenReturn(false);
        when(waiverRepo.findByLeague_IdAndUser_IdAndGameWeek_IdAndPlanTypeOrderByPriorityAsc(
                7L, 10, 4, WaiverPlanType.REGULAR
        ))
                .thenReturn(List.of(first, second));
        when(progressRepo.findByLeague_IdAndUser_IdAndGameWeek_Id(7L, 10, 4))
                .thenReturn(Optional.of(progress));
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(userData));
        when(gameDataRepo.findAllByLeagueIdWithSquads(7L)).thenReturn(List.of(userData, otherData));
        when(playerRepo.findById(100)).thenReturn(Optional.of(outgoing));
        when(playerRepo.findById(200)).thenReturn(Optional.of(secondChoice));
        when(playerRepo.findById(300)).thenReturn(Optional.of(unavailableFirstChoice));
        when(playerRepo.findAllById(any())).thenReturn(List.of(secondChoice));
        when(userRepo.findById(10)).thenReturn(Optional.of(user));

        service.processOfflineTurn(7L);

        assertEquals(List.of(200), userData.getNextSquad().getStartingLineup());
        assertEquals(1, window.getRegularCursor());
        verify(squadRepo).save(userData.getNextSquad());
        verify(webSocket).sendTransferDoneEvent(7L, 10, 100, 200, "Offline Manager");
        ArgumentCaptor<WaiverPlanProgressEntity> progressCaptor =
                ArgumentCaptor.forClass(WaiverPlanProgressEntity.class);
        verify(progressRepo).save(progressCaptor.capture());
        assertEquals(6, progressCaptor.getValue().getNextPriority());
    }

    @Test
    void offlineTurnWithoutValidPreferencesPassesAutomatically() {
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverRepo = mock(WaiverPreferenceRepository.class);
        WaiverPlanProgressRepository progressRepo = mock(WaiverPlanProgressRepository.class);
        WebSocketPresenceService presence = mock(WebSocketPresenceService.class);
        UserRepository userRepo = mock(UserRepository.class);
        TransferWebSocketController webSocket = mock(TransferWebSocketController.class);
        TransferMarketService service = new TransferMarketService(
                mock(PlayerRepository.class),
                mock(GameWeekRepository.class),
                mock(UserSquadRepository.class),
                mock(UserGameDataRepository.class),
                userRepo,
                mock(LeagueRepository.class),
                mock(LeagueAccessService.class),
                windowRepo,
                waiverRepo,
                progressRepo,
                mock(LeagueTransferActionRepository.class),
                presence,
                webSocket,
                mock(SupplementalDraftPoolService.class),
                0
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setTurnOrder(List.of(10, 11));
        window.open(List.of());
        UserEntity user = user(10, "Offline Manager");
        WaiverPlanProgressEntity progress = new WaiverPlanProgressEntity();
        progress.setNextPriority(6);

        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(presence.isOnline(10)).thenReturn(false);
        when(waiverRepo.findByLeague_IdAndUser_IdAndGameWeek_IdAndPlanTypeOrderByPriorityAsc(
                7L, 10, 4, WaiverPlanType.REGULAR
        ))
                .thenReturn(List.of());
        when(progressRepo.findByLeague_IdAndUser_IdAndGameWeek_Id(7L, 10, 4))
                .thenReturn(Optional.of(progress));
        when(userRepo.findById(10)).thenReturn(Optional.of(user));

        service.processOfflineTurn(7L);

        assertEquals(11, window.currentUserId().orElseThrow());
        verify(webSocket).sendPassEvent(7L, 10, "Offline Manager");
        verify(progressRepo, never()).save(any(WaiverPlanProgressEntity.class));
    }

    @Test
    void lineupDeadlineForfeitsRegularTurnsAndFillsIrForOnlineUserWithHighestScorer() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverRepo = mock(WaiverPreferenceRepository.class);
        LeagueTransferActionRepository actionRepo = mock(LeagueTransferActionRepository.class);
        WebSocketPresenceService presence = mock(WebSocketPresenceService.class);

        TransferMarketService service = new TransferMarketService(
                playerRepo, mock(GameWeekRepository.class), squadRepo, gameDataRepo, userRepo, leagueRepo,
                mock(LeagueAccessService.class), windowRepo, waiverRepo,
                mock(WaiverPlanProgressRepository.class), actionRepo, presence,
                mock(TransferWebSocketController.class), mock(SupplementalDraftPoolService.class), 0
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        gameWeek.setFirstKickoffTime(LocalDateTime.now().minusMinutes(1));
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setTurnOrder(List.of(10, 11));
        window.open(List.of(10));

        UserEntity user = user(10, "Online IR Manager");
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(List.of());
        squad.setBenchMap(new LinkedHashMap<>());
        squad.setIrId(100);
        UserGameDataEntity gameData = gameData(league, user, squad);
        gameData.getActiveChips().put("IR", true);
        PlayerEntity irPlayer = player(100, PlayerPosition.DEFENDER, 1);
        PlayerEntity highestScorer = player(200, PlayerPosition.DEFENDER, 2);
        highestScorer.setTotalPoints(90);
        PlayerEntity lowerScorer = player(201, PlayerPosition.DEFENDER, 3);
        lowerScorer.setTotalPoints(40);

        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(presence.isOnline(10)).thenReturn(true);
        when(waiverRepo.findByLeague_IdAndUser_IdAndGameWeek_IdAndPlanTypeOrderByPriorityAsc(
                7L, 10, 4, WaiverPlanType.IR
        )).thenReturn(List.of());
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(gameData));
        when(gameDataRepo.findAllByLeagueIdWithSquads(7L)).thenReturn(List.of(gameData));
        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(playerRepo.findAll()).thenReturn(List.of(lowerScorer, highestScorer));
        when(playerRepo.findById(100)).thenReturn(Optional.of(irPlayer));
        when(playerRepo.findById(200)).thenReturn(Optional.of(highestScorer));
        when(playerRepo.findById(201)).thenReturn(Optional.of(lowerScorer));
        when(playerRepo.findAllById(any())).thenReturn(List.of());
        when(userRepo.findById(10)).thenReturn(Optional.of(user));

        service.processOfflineTurn(7L);

        assertEquals(TransferWindowStatus.CLOSED, window.getStatus());
        assertEquals(2, window.getRegularCursor());
        assertEquals(1, window.getIrCursor());
        assertEquals(200, squad.getBenchMap().get("S3"));
        verify(squadRepo).save(squad);
        verify(actionRepo).save(any(LeagueTransferActionEntity.class));
        assertFalse(window.currentUserId().isPresent());
    }

    @Test
    void laterWaiverTurnCanClaimPlayerReleasedEarlierInSameWindow() {
        PlayerRepository playerRepo = mock(PlayerRepository.class);
        GameWeekRepository gameWeekRepo = mock(GameWeekRepository.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverRepo = mock(WaiverPreferenceRepository.class);
        LeagueTransferActionRepository actionRepo = mock(LeagueTransferActionRepository.class);
        WebSocketPresenceService presence = mock(WebSocketPresenceService.class);
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
                waiverRepo,
                mock(WaiverPlanProgressRepository.class),
                actionRepo,
                presence,
                webSocket,
                mock(SupplementalDraftPoolService.class),
                0
        );

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        GameWeekEntity gameWeek = new GameWeekEntity();
        gameWeek.setId(4);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setLeague(league);
        window.setGameWeek(gameWeek);
        window.setTurnOrder(List.of(11, 10));
        window.open(List.of());

        UserEntity firstUser = user(11, "First Manager");
        UserEntity laterUser = user(10, "Later Manager");
        UserGameDataEntity firstData = gameData(league, firstUser, squad(300));
        UserGameDataEntity laterData = gameData(league, laterUser, squad(100));
        PlayerEntity laterOutgoing = player(100, PlayerPosition.DEFENDER, 1);
        PlayerEntity firstIncoming = player(200, PlayerPosition.DEFENDER, 2);
        PlayerEntity releasedPlayer = player(300, PlayerPosition.DEFENDER, 3);

        WaiverPreferenceEntity firstPreference = preference(league, firstUser, gameWeek, 1, 200, 300);
        WaiverPreferenceEntity laterPreference = preference(league, laterUser, gameWeek, 1, 300, 100);

        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(presence.isOnline(11)).thenReturn(false);
        when(presence.isOnline(10)).thenReturn(false);
        when(waiverRepo.findByLeague_IdAndUser_IdAndGameWeek_IdAndPlanTypeOrderByPriorityAsc(
                7L, 11, 4, WaiverPlanType.REGULAR
        ))
                .thenReturn(List.of(firstPreference));
        when(waiverRepo.findByLeague_IdAndUser_IdAndGameWeek_IdAndPlanTypeOrderByPriorityAsc(
                7L, 10, 4, WaiverPlanType.REGULAR
        ))
                .thenReturn(List.of(laterPreference));
        when(gameDataRepo.findByUserId(11)).thenReturn(Optional.of(firstData));
        when(gameDataRepo.findByUserId(10)).thenReturn(Optional.of(laterData));
        when(gameDataRepo.findAllByLeagueIdWithSquads(7L)).thenReturn(List.of(firstData, laterData));
        when(playerRepo.findById(100)).thenReturn(Optional.of(laterOutgoing));
        when(playerRepo.findById(200)).thenReturn(Optional.of(firstIncoming));
        when(playerRepo.findById(300)).thenReturn(Optional.of(releasedPlayer));
        when(playerRepo.findAllById(any())).thenAnswer(invocation -> {
            Iterable<Integer> ids = invocation.getArgument(0);
            java.util.ArrayList<PlayerEntity> result = new java.util.ArrayList<>();
            for (Integer id : ids) {
                if (id == 100) result.add(laterOutgoing);
                if (id == 200) result.add(firstIncoming);
                if (id == 300) result.add(releasedPlayer);
            }
            return result;
        });
        when(userRepo.findById(11)).thenReturn(Optional.of(firstUser));
        when(userRepo.findById(10)).thenReturn(Optional.of(laterUser));

        service.processOfflineTurn(7L);
        assertEquals(List.of(200), firstData.getNextSquad().getStartingLineup());

        service.processOfflineTurn(7L);
        assertEquals(List.of(300), laterData.getNextSquad().getStartingLineup());
        verify(webSocket).sendTransferDoneEvent(7L, 10, 100, 300, "Later Manager");
    }

    private UserEntity user(int id, String name) {
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setName(name);
        return user;
    }

    private UserSquadEntity squad(int playerId) {
        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(List.of(playerId));
        squad.setBenchMap(new LinkedHashMap<>());
        return squad;
    }

    private UserGameDataEntity gameData(LeagueEntity league, UserEntity user, UserSquadEntity squad) {
        UserGameDataEntity data = new UserGameDataEntity();
        data.setLeague(league);
        data.setUser(user);
        data.setNextSquad(squad);
        return data;
    }

    private PlayerEntity player(int id, PlayerPosition position, int teamId) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setPosition(position);
        player.setTeamId(teamId);
        return player;
    }

    private WaiverPreferenceEntity preference(LeagueEntity league,
                                               UserEntity user,
                                               GameWeekEntity gameWeek,
                                               int priority,
                                               int playerInId,
                                               int playerOutId) {
        WaiverPreferenceEntity preference = new WaiverPreferenceEntity();
        preference.setLeague(league);
        preference.setUser(user);
        preference.setGameWeek(gameWeek);
        preference.setPriority(priority);
        preference.setPlayerInId(playerInId);
        preference.setPlayerOutId(playerOutId);
        return preference;
    }
}
