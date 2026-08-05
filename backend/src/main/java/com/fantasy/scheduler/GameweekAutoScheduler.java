package com.fantasy.scheduler;

import com.fantasy.domain.game.GameweekManager;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true")
public class GameweekAutoScheduler {

    private static final Logger log = LoggerFactory.getLogger(GameweekAutoScheduler.class);
    private static final int HOURS_AFTER_LAST_KICKOFF = 4;

    private final GameweekManager gameweekManager;
    private final GameWeekRepository gameweekRepository;

    public GameweekAutoScheduler(GameweekManager gameweekManager, GameWeekRepository gameweekRepository) {
        this.gameweekManager = gameweekManager;
        this.gameweekRepository = gameweekRepository;
    }

    @Scheduled(cron = "0 * * * * *")
    public void runScheduler() {
        LocalDateTime now = LocalDateTime.now();

        Optional<GameWeekEntity> upcoming = gameweekRepository.findFirstByStatusOrderByIdAsc("UPCOMING");
        if (upcoming.isPresent()) {
            GameWeekEntity nextGw = upcoming.get();
            if (nextGw.getFirstKickoffTime() == null) {
                log.warn("Cannot auto-open GW {} because first kickoff time is missing", nextGw.getId());
            } else if (now.isAfter(nextGw.getFirstKickoffTime()) || now.isEqual(nextGw.getFirstKickoffTime())) {
                log.info("Deadline reached for GW {}. Opening gameweek...", nextGw.getId());
                try {
                    gameweekManager.openNextGameweek(nextGw.getId(), false);
                    log.info("Successfully opened GW {}", nextGw.getId());
                } catch (Exception e) {
                    log.error("Failed to open GW {}", nextGw.getId(), e);
                }
            }
        }

        Optional<GameWeekEntity> live = gameweekRepository.findFirstByStatusOrderByIdAsc("LIVE");
        if (live.isPresent()) {
            GameWeekEntity gw = live.get();
            if (gw.getLastKickoffTime() == null) {
                log.warn("Cannot auto-process GW {} because last kickoff time is missing", gw.getId());
                return;
            }
            LocalDateTime safeProcessTime = gw.getLastKickoffTime().plusHours(HOURS_AFTER_LAST_KICKOFF);

            if (now.isAfter(safeProcessTime) && !gw.isCalculated()) {
                log.info("Gameweek {} finished (Safe time passed). Processing points & subs...", gw.getId());
                try {
                    gameweekManager.processGameweek(gw.getId(), false);
                    log.info("Successfully processed GW {}", gw.getId());
                } catch (Exception e) {
                    log.error("Failed to process GW {}", gw.getId(), e);
                }
            }
        }
    }
}
