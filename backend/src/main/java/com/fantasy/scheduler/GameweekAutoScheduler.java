package com.fantasy.scheduler;

import com.fantasy.domain.game.GameweekManager;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.GameWeekRepository;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.score.LiveScoreManager;
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
    private final FixtureRepository fixtureRepository;
    private final FixtureService fixtureService;
    private final LiveScoreManager liveScoreManager;
    private final GameWeekService gameWeekService;

    public GameweekAutoScheduler(GameweekManager gameweekManager,
                                 GameWeekRepository gameweekRepository,
                                 FixtureRepository fixtureRepository,
                                 FixtureService fixtureService,
                                 LiveScoreManager liveScoreManager,
                                 GameWeekService gameWeekService) {
        this.gameweekManager = gameweekManager;
        this.gameweekRepository = gameweekRepository;
        this.fixtureRepository = fixtureRepository;
        this.fixtureService = fixtureService;
        this.liveScoreManager = liveScoreManager;
        this.gameWeekService = gameWeekService;
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
                log.info("Gameweek {} reached its safe finalization time. Verifying final FPL data...", gw.getId());
                try {
                    fixtureService.updateFixturesForGameweek(gw.getId());
                    // A postponed fixture may have moved to another event or received
                    // a new kickoff. Persist the revised event boundaries before the
                    // next scheduler cycle decides when it is safe to finalize.
                    gameWeekService.updateGameWeekDeadlines();
                    var fixtures = fixtureRepository.findByGameweekId(gw.getId());
                    if (fixtures.isEmpty() || fixtures.stream().anyMatch(fixture -> !fixture.isFinished())) {
                        log.warn(
                                "Deferring GW {} finalization because at least one fixture is not confirmed finished",
                                gw.getId()
                        );
                        return;
                    }
                    liveScoreManager.updateLiveScores(gw.getId());
                    gameweekManager.processGameweek(gw.getId(), false);
                    log.info("Successfully processed GW {}", gw.getId());
                } catch (Exception e) {
                    log.error("Failed to process GW {}", gw.getId(), e);
                }
            }
        }
    }
}
