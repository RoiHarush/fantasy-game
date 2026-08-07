package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.config.WebSocketPresenceService;
import com.fantasy.domain.game.GameWeekRepository;
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

import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
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
        WebSocketPresenceService presenceService = mock(WebSocketPresenceService.class);
        TransferWebSocketController webSocket = mock(TransferWebSocketController.class);
        TransferMarketService service = new TransferMarketService(
                playerRepo, gameWeekRepo, squadRepo, gameDataRepo, userRepo, leagueRepo,
                leagueAccess, windowRepo, waiverPreferenceRepo, actionRepo, presenceService, webSocket, 30
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
        WebSocketPresenceService presenceService = mock(WebSocketPresenceService.class);
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
                actionRepo,
                presenceService,
                webSocket,
                30
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
        WebSocketPresenceService presenceService = mock(WebSocketPresenceService.class);
        TransferWebSocketController webSocket = mock(TransferWebSocketController.class);
        TransferMarketService service = new TransferMarketService(
                playerRepo, gameWeekRepo, squadRepo, gameDataRepo, userRepo, leagueRepo,
                leagueAccess, windowRepo, waiverPreferenceRepo, actionRepo, presenceService, webSocket, 30
        );

        LeagueTransferWindowEntity completedDraft = new LeagueTransferWindowEntity();
        completedDraft.setWindowType(TransferWindowType.DRAFT);
        completedDraft.setTurnOrder(List.of(10, 20, 30));
        completedDraft.open(List.of());
        completedDraft.close();

        when(leagueAccess.requireLeagueIdForUser(10)).thenReturn(7L);
        when(windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                7L, 1, TransferWindowType.TRANSFER
        )).thenReturn(Optional.empty());
        when(windowRepo.findByLeague_IdAndGameWeek_IdAndWindowType(
                7L, 1, TransferWindowType.DRAFT
        )).thenReturn(Optional.of(completedDraft));

        assertEquals(List.of(20, 30, 10, 10, 30, 20), service.getCurrentTurnOrder(10, 1));
    }

    private PlayerEntity player(int id, PlayerPosition position, int teamId) {
        PlayerEntity player = new PlayerEntity();
        player.setId(id);
        player.setPosition(position);
        player.setTeamId(teamId);
        return player;
    }
}
