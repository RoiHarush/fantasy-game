package com.fantasy.scheduler;

import com.fantasy.domain.transfer.TransferMarketService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.time.Instant;
import java.time.Duration;
import java.util.concurrent.ScheduledFuture;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.junit.jupiter.api.Assertions.assertFalse;

class WaiverAutomationSchedulerEventTest {

    @Test
    void turnEventWakesOnlyTheAffectedLeagueWithoutDatabasePolling() {
        TransferMarketService market = mock(TransferMarketService.class);
        ThreadPoolTaskScheduler taskScheduler = mock(ThreadPoolTaskScheduler.class);
        doReturn(mock(ScheduledFuture.class))
                .when(taskScheduler).schedule(any(Runnable.class), any(Instant.class));
        WaiverAutomationScheduler automation = new WaiverAutomationScheduler(
                market,
                taskScheduler,
                Duration.ofSeconds(2)
        );

        Instant invokedAt = Instant.now();
        automation.turnChanged(new TransferTurnChangedEvent(17L));

        ArgumentCaptor<Runnable> task = ArgumentCaptor.forClass(Runnable.class);
        ArgumentCaptor<Instant> runAt = ArgumentCaptor.forClass(Instant.class);
        verify(taskScheduler).schedule(task.capture(), runAt.capture());
        assertFalse(runAt.getValue().isBefore(invokedAt.plusSeconds(2)));
        task.getValue().run();
        verify(market).processAutomaticTurn(17L);
    }
}
