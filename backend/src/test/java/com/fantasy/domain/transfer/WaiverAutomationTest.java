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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
                mock(LeagueAccessService.class), windowRepo, waiverRepo,
                mock(LeagueTransferActionRepository.class), presence, mock(TransferWebSocketController.class),
                mock(SupplementalDraftPoolService.class), 0
        );
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(presence.isOnline(10)).thenReturn(true);

        service.processOfflineTurn(7L);

        assertEquals(10, window.currentUserId().orElseThrow());
        verify(waiverRepo, never()).findByLeague_IdAndUser_IdAndGameWeek_IdOrderByPriorityAsc(7L, 10, 4);
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

        WaiverPreferenceEntity first = preference(league, user, gameWeek, 1, 300, 100);
        WaiverPreferenceEntity second = preference(league, user, gameWeek, 2, 200, 100);

        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(presence.isOnline(10)).thenReturn(false);
        when(waiverRepo.findByLeague_IdAndUser_IdAndGameWeek_IdOrderByPriorityAsc(7L, 10, 4))
                .thenReturn(List.of(first, second));
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
    }

    @Test
    void offlineTurnWithoutValidPreferencesPassesAutomatically() {
        LeagueTransferWindowRepository windowRepo = mock(LeagueTransferWindowRepository.class);
        WaiverPreferenceRepository waiverRepo = mock(WaiverPreferenceRepository.class);
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

        when(windowRepo.findByLeagueAndStatusForUpdate(7L, TransferWindowStatus.OPEN))
                .thenReturn(List.of(window));
        when(presence.isOnline(10)).thenReturn(false);
        when(waiverRepo.findByLeague_IdAndUser_IdAndGameWeek_IdOrderByPriorityAsc(7L, 10, 4))
                .thenReturn(List.of());
        when(userRepo.findById(10)).thenReturn(Optional.of(user));

        service.processOfflineTurn(7L);

        assertEquals(11, window.currentUserId().orElseThrow());
        verify(webSocket).sendPassEvent(7L, 10, "Offline Manager");
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
        when(waiverRepo.findByLeague_IdAndUser_IdAndGameWeek_IdOrderByPriorityAsc(7L, 11, 4))
                .thenReturn(List.of(firstPreference));
        when(waiverRepo.findByLeague_IdAndUser_IdAndGameWeek_IdOrderByPriorityAsc(7L, 10, 4))
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
