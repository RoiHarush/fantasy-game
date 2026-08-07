package com.fantasy.config;

import com.fantasy.application.SeasonResetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnProperty(name = "app.season-reset.enabled", havingValue = "true")
public class SeasonResetRunner implements ApplicationRunner {

    public static final String REQUIRED_CONFIRMATION = "RESET_ALL_SEASON_DATA";

    private static final Logger log = LoggerFactory.getLogger(SeasonResetRunner.class);

    private final SeasonResetService resetService;
    private final String confirmation;
    private final boolean schedulingEnabled;

    public SeasonResetRunner(SeasonResetService resetService,
                             @Value("${app.season-reset.confirmation:}") String confirmation,
                             @Value("${app.scheduling.enabled:false}") boolean schedulingEnabled) {
        this.resetService = resetService;
        this.confirmation = confirmation;
        this.schedulingEnabled = schedulingEnabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (schedulingEnabled) {
            throw new IllegalStateException(
                    "Season reset refused: app.scheduling.enabled must be false"
            );
        }
        if (!REQUIRED_CONFIRMATION.equals(confirmation)) {
            throw new IllegalStateException(
                    "Season reset refused: set app.season-reset.confirmation=" + REQUIRED_CONFIRMATION
            );
        }

        var summary = resetService.resetAllData();
        log.warn(
                "Season reset removed {} rows across {} tables",
                summary.deletedRows(),
                summary.clearedTables()
        );
    }
}
