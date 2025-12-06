package com.fantasy.scheduler;

import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.score.LiveScoreManager;
import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.game.GameWeekRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class LiveUpdatesScheduler {

    private static final Logger log = LoggerFactory.getLogger(LiveUpdatesScheduler.class);

    private final FixtureRepository fixtureRepository;
    private final GameWeekRepository gameweekRepository;
    private final FixtureService fixtureService;
    private final LiveScoreManager liveScoreManager;

    public LiveUpdatesScheduler(FixtureRepository fixtureRepository,
                                GameWeekRepository gameweekRepository,
                                FixtureService fixtureService,
                                LiveScoreManager liveScoreManager) {
        this.fixtureRepository = fixtureRepository;
        this.gameweekRepository = gameweekRepository;
        this.fixtureService = fixtureService;
        this.liveScoreManager = liveScoreManager;
    }

    @Scheduled(cron = "0 * * * * *")
    public void runLiveUpdates() {
        Optional<GameWeekEntity> liveGw = gameweekRepository.findFirstByStatusOrderByIdAsc("LIVE");
        if (liveGw.isEmpty()) return;

        int gwId = liveGw.get().getId();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTimeLimit = now.minusMinutes(140);

        boolean hasActiveGames = fixtureRepository.hasActiveFixtures(now, startTimeLimit);

        if (hasActiveGames) {
             log.info("Active games detected in GW {}. Running live updates...", gwId);

            try {
                fixtureService.updateFixturesForGameweek(gwId);
                liveScoreManager.updateLiveScores(gwId);

            } catch (Exception e) {
                log.error("Critical error during live updates cycle", e);
            }
        }
    }
}