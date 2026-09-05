package com.fantasy.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import static org.assertj.core.api.Assertions.assertThat;

class MemoryPressureMonitorContextTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(SchedulingTestConfiguration.class, MemoryPressureMonitor.class)
            .withPropertyValues("app.memory.monitor-enabled=true");

    @Test
    void startsWithTheDefaultNumericLogInterval() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(MemoryPressureMonitor.class);
        });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableScheduling
    static class SchedulingTestConfiguration {
    }
}
