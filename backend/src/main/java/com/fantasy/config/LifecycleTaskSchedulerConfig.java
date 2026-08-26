package com.fantasy.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true")
public class LifecycleTaskSchedulerConfig {

    /**
     * Dedicated executor for the two genuinely periodic jobs that remain:
     * live-score refreshes and the two-hour FPL reconciliation. Naming it
     * taskScheduler prevents Spring from borrowing the WebSocket heartbeat
     * executor for potentially slow HTTP/database work.
     */
    @Bean(name = "taskScheduler")
    public ThreadPoolTaskScheduler periodicTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("fantasy-periodic-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(20);
        scheduler.setRemoveOnCancelPolicy(true);
        return scheduler;
    }

    @Bean(name = "fantasyLifecycleTaskScheduler")
    public ThreadPoolTaskScheduler fantasyLifecycleTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("fantasy-lifecycle-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(20);
        scheduler.setRemoveOnCancelPolicy(true);
        return scheduler;
    }

    @Bean(name = "fantasyTransferAutomationTaskScheduler")
    public ThreadPoolTaskScheduler fantasyTransferAutomationTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("fantasy-transfer-automation-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(20);
        scheduler.setRemoveOnCancelPolicy(true);
        return scheduler;
    }

    @Bean(name = "fantasyAiTaskScheduler")
    public ThreadPoolTaskScheduler fantasyAiTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("fantasy-ai-");
        scheduler.setWaitForTasksToCompleteOnShutdown(false);
        scheduler.setRemoveOnCancelPolicy(true);
        return scheduler;
    }
}
