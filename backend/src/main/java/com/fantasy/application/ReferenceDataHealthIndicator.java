package com.fantasy.application;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("referenceData")
public class ReferenceDataHealthIndicator implements HealthIndicator {

    private final ReferenceDataBootstrapService bootstrapService;

    public ReferenceDataHealthIndicator(ReferenceDataBootstrapService bootstrapService) {
        this.bootstrapService = bootstrapService;
    }

    @Override
    public Health health() {
        try {
            var summary = bootstrapService.currentSummary();
            var builder = summary.isComplete()
                    ? Health.up()
                    : Health.outOfService()
                    .withDetail(
                            "action",
                            "Run once with BOOTSTRAP_ENABLED=true or perform an explicit season reset"
                    );

            return builder
                    .withDetail("teams", summary.teams())
                    .withDetail("players", summary.players())
                    .withDetail("fixtures", summary.fixtures())
                    .withDetail("gameweeks", summary.gameweeks())
                    .build();
        } catch (Exception exception) {
            return Health.down(exception).build();
        }
    }
}
