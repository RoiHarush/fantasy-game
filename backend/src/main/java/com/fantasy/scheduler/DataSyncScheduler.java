package com.fantasy.scheduler;

import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.player.PlayerSyncService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(DataSyncScheduler.class);

    private final PlayerSyncService playerSyncService;
    private final FixtureService fixtureService;
    private final GameWeekService gameWeekService;
    private final FixtureRepository fixtureRepository;

    public DataSyncScheduler(PlayerSyncService playerSyncService, FixtureService fixtureService,
                             GameWeekService gameWeekService, FixtureRepository fixtureRepository) {
        this.playerSyncService = playerSyncService;
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
            log.info("Skipping Periodic Data Sync. Active games detected.");
            return;
        }

        log.info("Starting Periodic Data Sync");

        try {
            playerSyncService.refreshBasicPlayerData();
            log.info("Players synced.");
        } catch (Exception e) {
            log.error("Unexpected error syncing players: {}", e.getMessage());
        }

        try {
            fixtureService.loadFromApiAndSave();
            log.info("Fixtures synced.");
        } catch (Exception e) {
            log.error("Unexpected error syncing fixtures: {}", e.getMessage());
        }

        try {
            gameWeekService.updateGameWeekDeadlines();
            log.info("GameWeek deadlines synced.");
        } catch (Exception e) {
            log.error("Unexpected error updating deadlines: {}", e.getMessage());
        }

        log.info("Periodic Data Sync process finished.");
    }
}