package com.fantasy.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SchedulingConfigTest {

    private static final String SCHEDULED_PROCESSOR =
            "org.springframework.context.annotation.internalScheduledAnnotationProcessor";

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(SchedulingConfig.class);

    @Test
    void schedulingInfrastructureIsDisabledByDefault() {
        contextRunner.run(context -> assertFalse(context.containsBean(SCHEDULED_PROCESSOR)));
    }

    @Test
    void schedulingInfrastructureIsEnabledExplicitly() {
        contextRunner
                .withPropertyValues("app.scheduling.enabled=true")
                .run(context -> assertTrue(context.containsBean(SCHEDULED_PROCESSOR)));
    }
}
