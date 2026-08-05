package com.fantasy.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SchedulingConfigTest {

    private static final String SCHEDULED_PROCESSOR =
            "org.springframework.context.annotation.internalScheduledAnnotationProcessor";

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(SchedulingConfig.class);

    @Test
    void schedulingInfrastructureIsAlwaysAvailableForInitialDrafts() {
        contextRunner.run(context -> assertTrue(context.containsBean(SCHEDULED_PROCESSOR)));
    }
}
