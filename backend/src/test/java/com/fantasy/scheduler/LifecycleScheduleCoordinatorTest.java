package com.fantasy.scheduler;

import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.GameweekDailyStatusRepository;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.transfer.DraftConfig;
import com.fantasy.domain.transfer.DraftConfigRepository;
import com.fantasy.domain.transfer.DraftService;
import com.fantasy.domain.transfer.DraftType;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ScheduledFuture;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LifecycleScheduleCoordinatorTest {

    private static final ZoneId LEAGUE_ZONE = ZoneId.of("Asia/Jerusalem");

    @Test
    void schedulesTransferAndGameweekAtTheirPersistedExactDeadlines() {
        Dependencies dependencies = new Dependencies();
        GameWeekEntity upcoming = upcomingGameweek(
                LocalDateTime.now(LEAGUE_ZONE).plusHours(2),
                LocalDateTime.now(LEAGUE_ZONE).plusHours(1)
        );
        when(dependencies.gameWeekRepository.findFirstByStatusOrderByIdAsc("UPCOMING"))
                .thenReturn(Optional.of(upcoming));

        dependencies.coordinator.reconcile("test");

        ArgumentCaptor<Instant> deadlines = ArgumentCaptor.forClass(Instant.class);
        verify(dependencies.scheduler, times(4)).schedule(any(Runnable.class), deadlines.capture());
        List<Instant> values = deadlines.getAllValues();
        assertTrue(values.contains(upcoming.getTransferOpenTime().atZone(LEAGUE_ZONE).toInstant()));
        assertTrue(values.contains(upcoming.getFirstKickoffTime().atZone(LEAGUE_ZONE).toInstant()));
    }

    @Test
    void gameweekOneSchedulesLineupLifecycleButNeverATransferWindow() {
        Dependencies dependencies = new Dependencies();
        GameWeekEntity upcoming = upcomingGameweek(
                LocalDateTime.now(LEAGUE_ZONE).plusHours(2),
                LocalDateTime.now(LEAGUE_ZONE).plusHours(1)
        );
        upcoming.setId(1);
        when(dependencies.gameWeekRepository.findFirstByStatusOrderByIdAsc("UPCOMING"))
                .thenReturn(Optional.of(upcoming));

        dependencies.coordinator.reconcile("gameweek one");

        ArgumentCaptor<Instant> deadlines = ArgumentCaptor.forClass(Instant.class);
        verify(dependencies.scheduler, times(2)).schedule(any(Runnable.class), deadlines.capture());
        assertTrue(deadlines.getAllValues().contains(
                upcoming.getFirstKickoffTime().atZone(LEAGUE_ZONE).toInstant()
        ));
        verify(dependencies.transferWindowScheduler, times(0)).checkAndOpenTransferWindow();
    }

    @Test
    void fplDeadlineChangeCancelsTheOldTaskAndSchedulesTheNewInstant() {
        Dependencies dependencies = new Dependencies();
        LocalDateTime original = LocalDateTime.now(LEAGUE_ZONE).plusHours(2);
        GameWeekEntity upcoming = upcomingGameweek(original, null);
        ScheduledFuture<?> firstFuture = mock(ScheduledFuture.class);
        ScheduledFuture<?> secondFuture = mock(ScheduledFuture.class);
        doReturn(firstFuture, secondFuture)
                .when(dependencies.scheduler).schedule(any(Runnable.class), any(Instant.class));
        when(dependencies.gameWeekRepository.findFirstByStatusOrderByIdAsc("UPCOMING"))
                .thenReturn(Optional.of(upcoming));

        dependencies.coordinator.reconcile("initial FPL deadline");
        LocalDateTime moved = original.plusDays(2);
        upcoming.setFirstKickoffTime(moved);
        dependencies.coordinator.reconcile("FPL rescheduled fixture");

        verify(firstFuture).cancel(false);
        verify(secondFuture, org.mockito.Mockito.atLeastOnce()).cancel(false);
        ArgumentCaptor<Instant> deadlines = ArgumentCaptor.forClass(Instant.class);
        verify(dependencies.scheduler, times(4)).schedule(any(Runnable.class), deadlines.capture());
        assertEquals(moved.atZone(LEAGUE_ZONE).toInstant(), deadlines.getAllValues().get(3));
    }

    @Test
    void overdueRecoveryFinalizesPreviousGameweekBeforeOpeningTheNextOne() {
        Dependencies dependencies = new Dependencies();
        LocalDateTime now = LocalDateTime.now(LEAGUE_ZONE);
        GameWeekEntity live = new GameWeekEntity();
        live.setId(4);
        live.setStatus("LIVE");
        live.setCalculated(false);
        live.setLastKickoffTime(now.minusHours(10));
        GameWeekEntity upcoming = upcomingGameweek(now.minusHours(1), now.minusHours(2));
        when(dependencies.gameWeekRepository.findFirstByStatusOrderByIdAsc("LIVE"))
                .thenReturn(Optional.of(live));
        when(dependencies.gameWeekRepository.findFirstByStatusOrderByIdAsc("UPCOMING"))
                .thenReturn(Optional.of(upcoming));

        List<Runnable> scheduledActions = new ArrayList<>();
        when(dependencies.scheduler.schedule(any(Runnable.class), any(Instant.class)))
                .thenAnswer(invocation -> {
                    scheduledActions.add(invocation.getArgument(0));
                    return mock(ScheduledFuture.class);
                });

        dependencies.coordinator.reconcile("restart after outage");
        scheduledActions.forEach(Runnable::run);

        InOrder order = inOrder(dependencies.gameweekAutoScheduler);
        order.verify(dependencies.gameweekAutoScheduler).finalizeDueGameweek();
        order.verify(dependencies.gameweekAutoScheduler).openDueGameweek();
        verify(dependencies.dataSyncScheduler, times(2)).syncFixtureScheduleOnly();
    }

    @Test
    void schedulesDraftReminderTenMinutesBeforePersistedDraftDeadline() {
        Dependencies dependencies = new Dependencies();
        ScheduledNotificationService notifications = mock(ScheduledNotificationService.class);
        dependencies.coordinator.setScheduledNotificationService(notifications);

        LeagueEntity league = new LeagueEntity();
        league.setId(12L);
        DraftConfig config = mock(DraftConfig.class);
        LocalDateTime scheduledTime = LocalDateTime.now(LEAGUE_ZONE).plusHours(1);
        when(config.getId()).thenReturn(44L);
        when(config.getLeague()).thenReturn(league);
        when(config.getScheduledTime()).thenReturn(scheduledTime);
        when(config.getDraftType()).thenReturn(DraftType.INITIAL);
        when(dependencies.draftConfigRepository.findAllByProcessedFalse()).thenReturn(List.of(config));
        long scheduledEpochSecond = scheduledTime.atZone(LEAGUE_ZONE).toEpochSecond();
        when(notifications.draftOpeningSoonComplete(
                12L, 44L, scheduledEpochSecond, DraftType.INITIAL
        )).thenReturn(false);

        dependencies.coordinator.reconcile("scheduled draft");

        ArgumentCaptor<Instant> deadlines = ArgumentCaptor.forClass(Instant.class);
        verify(dependencies.scheduler, times(2)).schedule(any(Runnable.class), deadlines.capture());
        assertTrue(deadlines.getAllValues().contains(
                scheduledTime.minusMinutes(10).atZone(LEAGUE_ZONE).toInstant()
        ));
        assertTrue(deadlines.getAllValues().contains(scheduledTime.atZone(LEAGUE_ZONE).toInstant()));
    }

    private static GameWeekEntity upcomingGameweek(LocalDateTime kickoff, LocalDateTime transferOpen) {
        GameWeekEntity upcoming = new GameWeekEntity();
        upcoming.setId(5);
        upcoming.setStatus("UPCOMING");
        upcoming.setFirstKickoffTime(kickoff);
        upcoming.setLastKickoffTime(kickoff.plusHours(2));
        upcoming.setTransferOpenTime(transferOpen);
        upcoming.setTransferWindowProcessed(false);
        return upcoming;
    }

    private static final class Dependencies {
        private final ThreadPoolTaskScheduler scheduler = mock(ThreadPoolTaskScheduler.class);
        private final GameWeekRepository gameWeekRepository = mock(GameWeekRepository.class);
        private final FixtureRepository fixtureRepository = mock(FixtureRepository.class);
        private final GameweekDailyStatusRepository dailyStatusRepository = mock(GameweekDailyStatusRepository.class);
        private final DraftConfigRepository draftConfigRepository = mock(DraftConfigRepository.class);
        private final GameweekAutoScheduler gameweekAutoScheduler = mock(GameweekAutoScheduler.class);
        private final DailyPointsScheduler dailyPointsScheduler = mock(DailyPointsScheduler.class);
        private final TransferWindowScheduler transferWindowScheduler = mock(TransferWindowScheduler.class);
        private final DraftService draftService = mock(DraftService.class);
        private final DataSyncScheduler dataSyncScheduler = mock(DataSyncScheduler.class);
        private final LifecycleScheduleCoordinator coordinator;

        private Dependencies() {
            ScheduledFuture<?> defaultFuture = mock(ScheduledFuture.class);
            doReturn(defaultFuture)
                    .when(scheduler).schedule(any(Runnable.class), any(Instant.class));
            when(gameWeekRepository.findFirstByStatusOrderByIdAsc("LIVE")).thenReturn(Optional.empty());
            when(gameWeekRepository.findFirstByStatusOrderByIdAsc("UPCOMING")).thenReturn(Optional.empty());
            when(draftConfigRepository.findAllByProcessedFalse()).thenReturn(List.of());
            coordinator = new LifecycleScheduleCoordinator(
                    scheduler,
                    gameWeekRepository,
                    fixtureRepository,
                    dailyStatusRepository,
                    draftConfigRepository,
                    gameweekAutoScheduler,
                    dailyPointsScheduler,
                    transferWindowScheduler,
                    draftService,
                    dataSyncScheduler
            );
        }
    }
}
