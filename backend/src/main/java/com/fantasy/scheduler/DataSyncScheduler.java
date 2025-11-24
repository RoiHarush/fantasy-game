package com.fantasy.scheduler;

import com.fantasy.application.FixtureService;
import com.fantasy.application.PlayerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class DataSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(DataSyncScheduler.class);

    private final PlayerService playerService;
    private final FixtureService fixtureService;

    public DataSyncScheduler(PlayerService playerService, FixtureService fixtureService) {
        this.playerService = playerService;
        this.fixtureService = fixtureService;
    }

    @Scheduled(cron = "0 0 */2 * * *")
    public void syncGeneralData() {
        log.info("Starting Periodic Data Sync...");

        try {
            playerService.refreshBasicPlayerData();
            log.info("Players data synced successfully.");
        } catch (Exception e) {
            log.error("Error syncing players: ", e);
        }

        try {
            fixtureService.loadFromApiAndSave();
            log.info("Fixtures schedule synced successfully.");
        } catch (Exception e) {
            log.error("Error syncing fixtures: ", e);
        }

        log.info("Periodic Data Sync completed.");
    }
}