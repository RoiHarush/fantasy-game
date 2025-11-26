package com.fantasy.scheduler;

import com.fantasy.application.FixtureService;
import com.fantasy.application.GameWeekService;
import com.fantasy.application.PlayerService;
import com.fantasy.infrastructure.repositories.FixtureRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(DataSyncScheduler.class);

    private final PlayerService playerService;
    private final FixtureService fixtureService;
    private final GameWeekService gameWeekService;
    private final FixtureRepository fixtureRepository;

    public DataSyncScheduler(PlayerService playerService, FixtureService fixtureService,
                             GameWeekService gameWeekService, FixtureRepository fixtureRepository) {
        this.playerService = playerService;
        this.fixtureService = fixtureService;
        this.gameWeekService = gameWeekService;
        this.fixtureRepository = fixtureRepository;
    }

    @Scheduled(cron = "0 0 */2 * * *")
    public void syncGeneralData() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTimeLimit = now.minusMinutes(140);
        boolean hasActiveGames = fixtureRepository.hasActiveFixtures(now, startTimeLimit);

        if (hasActiveGames) {
            log.info("Skipping Periodic Data Sync. Active games detected ({} - {}). Live updates are running.", startTimeLimit, now);
            return;
        }

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

        try {
            gameWeekService.updateGameWeekDeadlines();
            log.info("GameWeek deadlines updated successfully.");
        } catch (Exception e) {
            log.error("Error updating GameWeek deadlines: ", e);
        }

        log.info("Periodic Data Sync completed.");
    }
}