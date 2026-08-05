package com.fantasy.domain.game;

import com.fantasy.application.SystemStatusService;
import com.fantasy.domain.player.PlayerGameweekStatsRepository;
import com.fantasy.domain.league.LeaguePlayerCatalog;
import com.fantasy.domain.score.PointsService;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GameweekManagerRolloverTest {

    @Test
    void manualRetryDoesNotRolloverAnAlreadyLiveGameweek() {
        Dependencies dependencies = new Dependencies();
        GameWeekEntity live = new GameWeekEntity();
        live.setId(5);
        live.setStatus("LIVE");
        when(dependencies.gameweekRepository.findByIdWithLock(5)).thenReturn(Optional.of(live));

        dependencies.manager.openNextGameweek(5, true);

        verify(dependencies.gameDataRepository, never()).findAllWithRelations();
        verify(dependencies.systemStatusService).setRolloverInProgress(true);
        verify(dependencies.systemStatusService).setRolloverInProgress(false);
    }

    @Test
    void copiesPreparedSquadDirectlyIncludingEmptyBenchSlots() {
        Dependencies dependencies = new Dependencies();
        GameWeekEntity upcoming = new GameWeekEntity();
        upcoming.setId(5);
        upcoming.setStatus("UPCOMING");
        when(dependencies.gameweekRepository.findByIdWithLock(5)).thenReturn(Optional.of(upcoming));
        when(dependencies.gameweekRepository.findFirstByStatusOrderByIdAsc("LIVE"))
                .thenReturn(Optional.empty());

        UserSquadEntity prepared = new UserSquadEntity();
        prepared.setGameweek(5);
        prepared.setStartingLineup(new ArrayList<>(List.of(1, 2)));
        Map<String, Integer> bench = new LinkedHashMap<>();
        bench.put("GK", 3);
        bench.put("S3", null);
        prepared.setBenchMap(bench);
        prepared.setFormation(new LinkedHashMap<>(Map.of("GK", 1, "DEF", 1)));
        prepared.setCaptainId(1);
        prepared.setViceCaptainId(2);

        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setId(20);
        gameData.setNextSquad(prepared);
        gameData.setActiveChips(new HashMapWithFirstPick());
        when(dependencies.gameDataRepository.findAllWithRelations()).thenReturn(List.of(gameData));
        when(dependencies.squadRepository.findByUser_IdAndGameweek(20, 6)).thenReturn(Optional.empty());
        when(dependencies.squadRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        dependencies.manager.openNextGameweek(5, false);

        ArgumentCaptor<UserSquadEntity> captor = ArgumentCaptor.forClass(UserSquadEntity.class);
        verify(dependencies.squadRepository).save(captor.capture());
        UserSquadEntity next = captor.getValue();
        assertEquals(6, next.getGameweek());
        assertEquals(bench, next.getBenchMap());
        assertSame(prepared, gameData.getCurrentSquad());
        assertSame(next, gameData.getNextSquad());
        assertEquals(false, gameData.getActiveChips().get("FIRST_PICK_CAPTAIN"));
    }

    @Test
    void reusesAlreadyPreparedFollowingSquadInsteadOfCreatingDuplicate() {
        Dependencies dependencies = new Dependencies();
        GameWeekEntity upcoming = new GameWeekEntity();
        upcoming.setId(5);
        upcoming.setStatus("UPCOMING");
        when(dependencies.gameweekRepository.findByIdWithLock(5)).thenReturn(Optional.of(upcoming));
        when(dependencies.gameweekRepository.findFirstByStatusOrderByIdAsc("LIVE"))
                .thenReturn(Optional.empty());

        UserSquadEntity prepared = new UserSquadEntity();
        prepared.setGameweek(5);
        prepared.setStartingLineup(new ArrayList<>(List.of(1, 2)));
        prepared.setBenchMap(new LinkedHashMap<>());
        prepared.setFormation(new LinkedHashMap<>());

        UserSquadEntity existingFollowingSquad = new UserSquadEntity();
        existingFollowingSquad.setId(99L);
        existingFollowingSquad.setGameweek(6);

        UserGameDataEntity gameData = new UserGameDataEntity();
        gameData.setId(20);
        gameData.setNextSquad(prepared);
        when(dependencies.gameDataRepository.findAllWithRelations()).thenReturn(List.of(gameData));
        when(dependencies.squadRepository.findByUser_IdAndGameweek(20, 6))
                .thenReturn(Optional.of(existingFollowingSquad));
        when(dependencies.squadRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        dependencies.manager.openNextGameweek(5, false);

        ArgumentCaptor<UserSquadEntity> captor = ArgumentCaptor.forClass(UserSquadEntity.class);
        verify(dependencies.squadRepository).save(captor.capture());
        assertSame(existingFollowingSquad, captor.getValue());
        assertEquals(99L, captor.getValue().getId());
        assertSame(existingFollowingSquad, gameData.getNextSquad());
    }

    private static class HashMapWithFirstPick extends java.util.HashMap<String, Boolean> {
        HashMapWithFirstPick() {
            put("FIRST_PICK_CAPTAIN", true);
        }
    }

    private static class Dependencies {
        private final UserGameDataRepository gameDataRepository = mock(UserGameDataRepository.class);
        private final UserSquadRepository squadRepository = mock(UserSquadRepository.class);
        private final GameWeekRepository gameweekRepository = mock(GameWeekRepository.class);
        private final SystemStatusService systemStatusService = mock(SystemStatusService.class);
        private final GameweekManager manager = new GameweekManager(
                gameDataRepository,
                squadRepository,
                gameweekRepository,
                mock(PlayerGameweekStatsRepository.class),
                mock(PointsService.class),
                mock(LeaguePlayerCatalog.class),
                systemStatusService,
                mock(GameweekDailyStatusRepository.class),
                mock(FixtureRepository.class)
        );
    }
}
