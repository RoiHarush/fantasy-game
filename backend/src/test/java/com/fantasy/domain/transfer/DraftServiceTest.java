package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekDto;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
    void refusesToStartUntilConfiguredNumberOfManagersHaveJoined() {
        Fixture fixture = fixture(3, List.of(manager(10), manager(20)));

        IllegalStateException error = assertThrows(
                IllegalStateException.class,
                () -> fixture.service.runSnakeDraft(7L)
        );

        assertEquals("All 3 managers must join before the initial draft", error.getMessage());
        verify(fixture.marketService, never()).openDraftWindow(eq(7L), eq(1), org.mockito.ArgumentMatchers.anyList());
    }

    private static Fixture fixture(int capacity, List<UserGameDataEntity> managers) {
        UserGameDataRepository gameDataRepo = mock(UserGameDataRepository.class);
        TransferMarketService marketService = mock(TransferMarketService.class);
        GameWeekService gameWeekService = mock(GameWeekService.class);
        DraftConfigRepository configRepo = mock(DraftConfigRepository.class);
        LeagueRepository leagueRepo = mock(LeagueRepository.class);
        LeagueAccessService leagueAccess = mock(LeagueAccessService.class);
        UserSquadRepository squadRepo = mock(UserSquadRepository.class);

        LeagueEntity league = new LeagueEntity();
        league.setId(7L);
        league.setMaxParticipants(capacity);
        league.setStatus(LeagueStatus.DRAFT_SCHEDULED);
        List<UserEntity> users = managers.stream().map(UserGameDataEntity::getUser).toList();
        league.setUsers(new ArrayList<>(users));

        when(leagueRepo.findById(7L)).thenReturn(Optional.of(league));
        when(gameDataRepo.findByLeague_Id(7L)).thenReturn(managers);
        when(configRepo.findByLeague_Id(7L)).thenReturn(Optional.empty());

        DraftService service = new DraftService(
                gameDataRepo, marketService, gameWeekService, configRepo, leagueRepo, leagueAccess, squadRepo
        );
        return new Fixture(service, marketService, gameWeekService, league, managers);
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
            LeagueEntity league,
            List<UserGameDataEntity> managers
    ) {}
}
