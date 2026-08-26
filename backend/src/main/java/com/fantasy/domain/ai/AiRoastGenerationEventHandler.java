package com.fantasy.domain.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = {"app.scheduling.enabled", "app.ai.roast-enabled"},
        havingValue = "true"
)
public class AiRoastGenerationEventHandler {
    private static final Logger log = LoggerFactory.getLogger(AiRoastGenerationEventHandler.class);

    private final ThreadPoolTaskScheduler scheduler;
    private final AiRoastService roastService;

    public AiRoastGenerationEventHandler(
            @Qualifier("fantasyAiTaskScheduler") ThreadPoolTaskScheduler scheduler,
            AiRoastService roastService) {
        this.scheduler = scheduler;
        this.roastService = roastService;
    }

    @EventListener
    public void onGenerationRequested(AiRoastGenerationRequestedEvent event) {
        try {
            scheduler.execute(() -> generateSafely(event));
        } catch (RuntimeException exception) {
            log.error("Automatic roast could not be queued; settled points remain unaffected: leagueId={}, gameweek={}, finalVersion={}",
                    event.leagueId(), event.gameweek(), event.finalVersion(), exception);
        }
    }

    private void generateSafely(AiRoastGenerationRequestedEvent event) {
        try {
            boolean updated = roastService.refreshForLeague(
                    event.leagueId(), event.gameweek(), event.finalVersion());
            if (!updated) {
                log.warn("Automatic roast was not replaced because the AI response was incomplete: leagueId={}, gameweek={}, finalVersion={}",
                        event.leagueId(), event.gameweek(), event.finalVersion());
            }
        } catch (RuntimeException exception) {
            log.error("Automatic roast generation failed without affecting settled points: leagueId={}, gameweek={}, finalVersion={}",
                    event.leagueId(), event.gameweek(), event.finalVersion(), exception);
        }
    }
}
