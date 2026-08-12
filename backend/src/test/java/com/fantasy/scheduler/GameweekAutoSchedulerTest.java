package com.fantasy.scheduler;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.game.GameweekManager;
import com.fantasy.domain.score.LiveScoreManager;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GameweekAutoSchedulerTest {

    @Test
    void defersFinalizationUntilEveryFixtureIsConfirmedFinished() {
        Dependencies dependencies = new Dependencies();
        GameWeekEntity gameweek = liveGameweek();
        FixtureEntity fixture = new FixtureEntity();
        fixture.setFinished(false);
        when(dependencies.gameWeekRepository.findFirstByStatusOrderByIdAsc("LIVE"))
                .thenReturn(Optional.of(gameweek));
        when(dependencies.fixtureRepository.findByGameweekId(4)).thenReturn(List.of(fixture));

        dependencies.scheduler.runScheduler();

        verify(dependencies.fixtureService).updateFixturesForGameweek(4);
        verify(dependencies.gameWeekService).updateGameWeekDeadlines();
        verify(dependencies.liveScoreManager, never()).updateLiveScores(4);
        verify(dependencies.gameweekManager, never()).processGameweek(4, false);
    }

    @Test
    void refreshesFinalStatsBeforeProcessingTheGameweek() {
        Dependencies dependencies = new Dependencies();
        GameWeekEntity gameweek = liveGameweek();
        FixtureEntity fixture = new FixtureEntity();
        fixture.setFinished(true);
        when(dependencies.gameWeekRepository.findFirstByStatusOrderByIdAsc("LIVE"))
                .thenReturn(Optional.of(gameweek));
        when(dependencies.fixtureRepository.findByGameweekId(4)).thenReturn(List.of(fixture));

        dependencies.scheduler.runScheduler();

        InOrder order = inOrder(
                dependencies.fixtureService,
                dependencies.gameWeekService,
                dependencies.liveScoreManager,
                dependencies.gameweekManager
        );
        order.verify(dependencies.fixtureService).updateFixturesForGameweek(4);
        order.verify(dependencies.gameWeekService).updateGameWeekDeadlines();
        order.verify(dependencies.liveScoreManager).updateLiveScores(4);
        order.verify(dependencies.gameweekManager).processGameweek(4, false);
    }

    @Test
    void keepsRecheckingAfterTheSafetyWindowUntilFplConfirmsTheFixtureFinished() {
        Dependencies dependencies = new Dependencies();
        GameWeekEntity gameweek = liveGameweek();
        FixtureEntity fixture = new FixtureEntity();
        fixture.setFinished(false);
        when(dependencies.gameWeekRepository.findFirstByStatusOrderByIdAsc("LIVE"))
                .thenReturn(Optional.of(gameweek));
        when(dependencies.fixtureRepository.findByGameweekId(4)).thenReturn(List.of(fixture));

        dependencies.scheduler.runScheduler();
        dependencies.scheduler.runScheduler();

        verify(dependencies.fixtureService, times(2)).updateFixturesForGameweek(4);
        verify(dependencies.gameweekManager, never()).processGameweek(4, false);
    }

    private GameWeekEntity liveGameweek() {
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(4);
        gameweek.setStatus("LIVE");
        gameweek.setCalculated(false);
        gameweek.setLastKickoffTime(LocalDateTime.now().minusHours(5));
        return gameweek;
    }

    private static class Dependencies {
        private final GameweekManager gameweekManager = mock(GameweekManager.class);
        private final GameWeekRepository gameWeekRepository = mock(GameWeekRepository.class);
        private final FixtureRepository fixtureRepository = mock(FixtureRepository.class);
        private final FixtureService fixtureService = mock(FixtureService.class);
        private final LiveScoreManager liveScoreManager = mock(LiveScoreManager.class);
        private final GameWeekService gameWeekService = mock(GameWeekService.class);
        private final GameweekAutoScheduler scheduler = new GameweekAutoScheduler(
                gameweekManager,
                gameWeekRepository,
                fixtureRepository,
                fixtureService,
                liveScoreManager,
                gameWeekService
        );
    }
}
