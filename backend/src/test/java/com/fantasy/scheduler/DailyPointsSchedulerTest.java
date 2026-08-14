package com.fantasy.scheduler;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.game.GameweekDailyStatusRepository;
import com.fantasy.domain.score.PointsService;
import com.fantasy.domain.team.UserGameDataRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DailyPointsSchedulerTest {

    @Test
    void doesNotPersistDailyPointsUntilFplConfirmsEveryFixtureFinished() {
        GameWeekRepository gameweeks = mock(GameWeekRepository.class);
        FixtureRepository fixtures = mock(FixtureRepository.class);
        GameweekDailyStatusRepository dailyStatuses = mock(GameweekDailyStatusRepository.class);
        PointsService points = mock(PointsService.class);
        UserGameDataRepository users = mock(UserGameDataRepository.class);
        FixtureService fixtureService = mock(FixtureService.class);
        GameWeekService gameWeekService = mock(GameWeekService.class);
        DailyPointsScheduler scheduler = new DailyPointsScheduler(
                gameweeks,
                fixtures,
                dailyStatuses,
                points,
                users,
                fixtureService,
                gameWeekService
        );
        LocalDate matchDate = LocalDate.now().minusDays(1);
        FixtureEntity unfinished = new FixtureEntity();
        unfinished.setId(1);
        unfinished.setGameweekId(4);
        unfinished.setKickoffTime(matchDate.atTime(18, 0));
        unfinished.setFinished(false);
        GameWeekEntity live = new GameWeekEntity();
        live.setId(4);
        live.setStatus("LIVE");
        live.setLastKickoffTime(LocalDateTime.now().plusDays(1));
        when(gameweeks.findFirstByStatusOrderByIdAsc("LIVE")).thenReturn(Optional.of(live));
        when(fixtures.findByGameweekId(4)).thenReturn(List.of(unfinished));
        when(fixtures.findTopByKickoffTimeBetweenOrderByKickoffTimeDesc(
                matchDate.atStartOfDay(),
                matchDate.atTime(java.time.LocalTime.MAX)
        )).thenReturn(Optional.of(unfinished));

        scheduler.processDailyPoints();

        verify(fixtureService).updateFixturesForGameweek(4);
        verify(points, never()).calculateAndPersist(org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.anyInt());
        verify(dailyStatuses, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
