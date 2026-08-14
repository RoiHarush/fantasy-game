package com.fantasy.scheduler;

import com.fantasy.domain.transfer.TransferMarketService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

@Component
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true")
public class WaiverAutomationScheduler {

    private static final Logger log = LoggerFactory.getLogger(WaiverAutomationScheduler.class);

    private final TransferMarketService transferMarketService;
    private final ThreadPoolTaskScheduler taskScheduler;
    private final Map<Long, ScheduledFuture<?>> pending = new ConcurrentHashMap<>();

    public WaiverAutomationScheduler(
            TransferMarketService transferMarketService,
            @Qualifier("fantasyTransferAutomationTaskScheduler") ThreadPoolTaskScheduler taskScheduler) {
        this.transferMarketService = transferMarketService;
        this.taskScheduler = taskScheduler;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void recoverOpenWindows() {
        transferMarketService.getOpenLeagueIds().forEach(this::wakeLeague);
    }

    @EventListener
    public void turnChanged(TransferTurnChangedEvent event) {
        wakeLeague(event.leagueId());
    }

    /** Compatibility entry point for simulations and explicit maintenance. */
    public void processAutomaticTurns() {
        for (Long leagueId : transferMarketService.getOpenLeagueIds()) {
            try {
                transferMarketService.processAutomaticTurn(leagueId);
            } catch (RuntimeException exception) {
                log.error("Failed to process automatic waiver turn for league {}", leagueId, exception);
            }
        }
    }

    private void wakeLeague(long leagueId) {
        pending.compute(leagueId, (id, existing) -> {
            if (existing != null && !existing.isDone() && !existing.isCancelled()) {
                return existing;
            }
            return taskScheduler.schedule(() -> processLeague(id), Instant.now());
        });
    }

    private void processLeague(long leagueId) {
        pending.remove(leagueId);
        try {
            transferMarketService.processAutomaticTurn(leagueId);
        } catch (RuntimeException exception) {
            log.error("Failed to process automatic waiver turn for league {}; retrying", leagueId, exception);
            ScheduledFuture<?> retry = taskScheduler.schedule(
                    () -> processLeague(leagueId),
                    Instant.now().plusSeconds(5)
            );
            if (retry != null) {
                pending.put(leagueId, retry);
            }
        }
    }
}
