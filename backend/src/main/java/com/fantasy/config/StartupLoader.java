package com.fantasy.config;

import com.fantasy.application.ReferenceDataBootstrapService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Explicit, opt-in reference-data bootstrap.
 *
 * <p>Schema migration is always handled by Flyway. Live FPL data is loaded only
 * when {@code app.bootstrap.enabled=true}, so a normal restart never performs
 * hundreds of remote calls or changes season data unexpectedly.</p>
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@ConditionalOnProperty(name = "app.bootstrap.enabled", havingValue = "true")
public class StartupLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupLoader.class);

    private final ReferenceDataBootstrapService bootstrapService;

    public StartupLoader(ReferenceDataBootstrapService bootstrapService) {
        this.bootstrapService = bootstrapService;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("=== EXPLICIT FPL BOOTSTRAP BEGIN ===");
        var summary = bootstrapService.bootstrapMissingData();
        log.info(
                "=== EXPLICIT FPL BOOTSTRAP COMPLETE: teams={}, players={}, fixtures={}, gameweeks={} ===",
                summary.teams(),
                summary.players(),
                summary.fixtures(),
                summary.gameweeks()
        );
    }
}
