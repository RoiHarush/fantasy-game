package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekDto;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameweekActivityPolicy;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.league.LeagueAccessService;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadRepository;
import com.fantasy.domain.user.UserEntity;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DraftServiceTest {

    @Test
    void createsFifteenSnakeRoundsAndEmptySquadsForEveryManager() {
        Fixture fixture = fixture(2, List.of(manager(10), manager(20)));
        when(fixture.gameWeekService.getNextGameweek())
                .thenReturn(new GameWeekDto(1, "Gameweek 1", null, null, "UPCOMING", null, false, false));

        fixture.service.runSnakeDraft(7L);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Integer>> orderCaptor = ArgumentCaptor.forClass(List.class);
        verify(fixture.marketService).openDraftWindow(eq(7L), eq(1), orderCaptor.capture());
        List<Integer> order = orderCaptor.getValue();

        assertEquals(30, order.size());
        assertEquals(15, order.stream().filter(id -> id == 10).count());
        assertEquals(15, order.stream().filter(id -> id == 20).count());
        assertNotEquals(order.get(0), order.get(1));
        assertEquals(order.get(1), order.get(2));
        assertEquals(order.get(0), order.get(3));
        assertEquals(LeagueStatus.DRAFT_LIVE, fixture.league.getStatus());
        assertEquals(1, fixture.managers.get(0).getNextSquad().getGameweek());
        assertEquals(1, fixture.managers.get(1).getNextSquad().getGameweek());
    }

    @Test
    void expandsASevenManagerManualBaseOrderIntoFifteenSnakeRounds() {
        List<UserGameDataEntity> managers = List.of(
                manager(10), manager(20), manager(30), manager(40),
                manager(50), manager(60), manager(70)
        );
        Fixture fixture = fixture(7, managers);
        when(fixture.gameWeekService.getNextGameweek())
                .thenReturn(new GameWeekDto(1, "Gameweek 1", null, null, "UPCOMING", null, false, false));
        List<Integer> manualBaseOrder = List.of(40, 10, 70, 20, 60, 30, 50);
        DraftConfig config = new DraftConfig();
        config.setLeague(fixture.league);
        config.setDraftType(DraftType.INITIAL);
        config.setOrderSource(DraftOrderSource.MANUAL);
        config.setManualOrder(manualBaseOrder);
        when(fixture.configRepo.findByLeague_Id(7L)).thenReturn(Optional.of(config));

        fixture.service.runSnakeDraft(7L);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Integer>> orderCaptor = ArgumentCaptor.forClass(List.class);
        verify(fixture.marketService).openDraftWindow(eq(7L), eq(1), orderCaptor.capture());
        List<Integer> snakeOrder = orderCaptor.getValue();

        assertEquals(105, snakeOrder.size());
        for (int round = 0; round < 15; round++) {
            List<Integer> expectedRound = new ArrayList<>(manualBaseOrder);
            if (round % 2 == 1) {
                java.util.Collections.reverse(expectedRound);
            }
            assertEquals(
                    expectedRound,
                    snakeOrder.subList(round * 7, (round + 1) * 7),
                    "Unexpected manager order in snake round " + (round + 1)
            );
        }
        manualBaseOrder.forEach(userId ->
                assertEquals(15, snakeOrder.stream().filter(id -> id.equals(userId)).count()));
    }

    @Test
    void storesAValidManualOrderWhenSchedulingTheInitialDraft() {
        Fixture fixture = fixture(2, List.of(manager(10), manager(20)));
        LocalDateTime scheduledTime = LocalDateTime.now().plusMinutes(30);

        fixture.service.scheduleDraftForLeague(
                7L,
                scheduledTime,
                DraftOrderSource.MANUAL,
                List.of(20, 10)
        );

        ArgumentCaptor<DraftConfig> configCaptor = ArgumentCaptor.forClass(DraftConfig.class);
        verify(fixture.configRepo).save(configCaptor.capture());
        DraftConfig saved = configCaptor.getValue();
        assertEquals(DraftOrderSource.MANUAL, saved.getOrderSource());
        assertEquals(List.of(20, 10), saved.getManualOrder());
        assertEquals(DraftType.INITIAL, saved.getDraftType());
    }

    @Test
    void rejectsDuplicateManagersInAnInitialManualOrder() {
        Fixture fixture = fixture(3, List.of(manager(10), manager(20), manager(30)));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> fixture.service.scheduleDraftForLeague(
                        7L,
                        LocalDateTime.now().plusMinutes(30),
                        DraftOrderSource.MANUAL,
                        List.of(10, 10, 20)
                )
        );

        assertEquals(
                "Every league manager must appear exactly once in the initial draft order",
                error.getMessage()
        );
        verify(fixture.configRepo, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void refusesToStartUntilConfiguredNumberOfManagersHaveJoined() {
        Fixture fixture = fixture(3, List.of(manager(10), manager(20)));

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> fixture.service.runSnakeDraft(7L)
        );

        assertEquals("All 3 managers must join before the initial draft", error.getMessage());
        verify(fixture.marketService, never()).openDraftWindow(eq(7L), eq(1), org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void dueScheduledDraftStartsWithoutAnAdminRequest() {
        Fixture fixture = fixture(2, List.of(manager(10), manager(20)));
        DraftConfig config = new DraftConfig();
        config.setLeague(fixture.league);
        config.setScheduledTime(LocalDateTime.now().minusSeconds(1));
        config.setProcessed(false);
        when(fixture.configRepo.findAllByProcessedFalse()).thenReturn(List.of(config));
        when(fixture.configRepo.findByLeague_Id(7L)).thenReturn(Optional.of(config));
        when(fixture.gameWeekService.getNextGameweek())
                .thenReturn(new GameWeekDto(1, "Gameweek 1", null, null, "UPCOMING", null, false, false));

        fixture.service.checkDraftSchedule();

        verify(fixture.marketService).openDraftWindow(eq(7L), eq(1), org.mockito.ArgumentMatchers.anyList());
        assertEquals(LeagueStatus.DRAFT_LIVE, fixture.league.getStatus());
        assertEquals(true, config.isProcessed());
    }

    @Test
    void schedulingDraftPublishesTheCountdownImmediately() {
        Fixture fixture = fixture(2, List.of(manager(10), manager(20)));
        LocalDateTime scheduledTime = LocalDateTime.now().plusMinutes(10);

        fixture.service.scheduleDraftForLeague(7L, scheduledTime);

        verify(fixture.webSocketController).sendDraftScheduledEvent(
                7L,
                scheduledTime,
                DraftType.INITIAL
        );
        assertEquals(LeagueStatus.DRAFT_SCHEDULED, fixture.league.getStatus());
    }

    @Test
    void refusesToScheduleOrOpenDraftDuringAnActiveGameweek() {
        Fixture fixture = fixture(2, List.of(manager(10), manager(20)));
        LocalDateTime now = LocalDateTime.now();
        GameWeekEntity live = new GameWeekEntity(
                1,
                "Gameweek 1",
                now.minusHours(1),
                now.plusHours(2),
                "LIVE"
        );
        when(fixture.gameWeekService.getAllGameweeks()).thenReturn(List.of(live));

        assertThrows(
                GameweekActivityPolicy.GameweekActiveException.class,
                () -> fixture.service.scheduleDraftForLeague(7L, now.plusMinutes(30))
        );
        assertThrows(
                GameweekActivityPolicy.GameweekActiveException.class,
                () -> fixture.service.runSnakeDraft(7L)
        );
        verify(fixture.marketService, never()).openDraftWindow(
                eq(7L),
                eq(1),
                org.mockito.ArgumentMatchers.anyList()
        );
    }

    @Test
    void activeLeagueOpensATwoRoundSupplementalDraftWithoutResettingSquads() {
        Fixture fixture = fixture(2, List.of(manager(10), manager(20)));
        fixture.league.setStatus(LeagueStatus.ACTIVE);
        when(fixture.poolService.playerIds(7L)).thenReturn(Set.of(501));
        when(fixture.gameWeekService.getNextGameweek())
                .thenReturn(new GameWeekDto(20, "Gameweek 20", null, null, "UPCOMING", null, false, false));
        DraftConfig config = new DraftConfig();
        config.setLeague(fixture.league);
        config.setDraftType(DraftType.SUPPLEMENTAL);
        config.setOrderSource(DraftOrderSource.MANUAL);
        config.setManualOrder(List.of(10, 20, 20, 10));
        when(fixture.configRepo.findByLeague_Id(7L)).thenReturn(Optional.of(config));

        fixture.service.runSnakeDraft(7L);

        verify(fixture.marketService).openSupplementalDraftWindow(
                7L,
                20,
                List.of(10, 20, 20, 10)
        );
        verify(fixture.marketService, never()).openDraftWindow(
                eq(7L),
                eq(20),
                org.mockito.ArgumentMatchers.anyList()
        );
        assertEquals(LeagueStatus.ACTIVE, fixture.league.getStatus());
        assertEquals(true, config.isProcessed());
    }

    private static Fixture fixture(int capacity, List<UserGameDataEntity> managers) {
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        TransferMarketService marketService = mock(TransferMarketService.class);
        GameWeekService gameWeekService = mock(GameWeekService.class);
        DraftConfigRepository configRepo = mock(DraftConfigRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);
        TransferWebSocketController webSocketController = mock(TransferWebSocketController.class);
        SupplementalDraftPoolService poolService = mock(SupplementalDraftPoolService.class);

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        league.setMaxParticipants(capacity);
        league.setStatus(LeagueStatus.DRAFT_SCHEDULED);
        List<UserEntity> users = managers.stream().map(UserGameDataEntity::getUser).toList();
        league.setUsers(new ArrayList<>(users));

        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(leagueRepo.findByIdWithLock(7L)).thenReturn(Optional.of(league));
        when(gameDataRepo.findByLeague_Id(7L)).thenReturn(managers);
        when(configRepo.findByLeague_Id(7L)).thenReturn(Optional.empty());

        DraftService service = new DraftService(
                gameDataRepo, marketService, gameWeekService, configRepo, leagueRepo, leagueAccess,
                squadRepo, webSocketController, poolService
        );
        return new Fixture(service, marketService, gameWeekService, configRepo, league, managers,
                webSocketController, poolService);
    }

    private static UserGameDataEntity manager(int userId) {
        UserEntity user = new UserEntity();
        user.setId(userId);
        UserGameDataEntity manager = new UserGameDataEntity();
        manager.setUser(user);
        return manager;
    }

    private record Fixture(
            DraftService service,
            TransferMarketService marketService,
            GameWeekService gameWeekService,
            DraftConfigRepository configRepo,
            LeagueEntity league,
            List<UserGameDataEntity> managers,
            TransferWebSocketController webSocketController,
            SupplementalDraftPoolService poolService
    ) {}
}
