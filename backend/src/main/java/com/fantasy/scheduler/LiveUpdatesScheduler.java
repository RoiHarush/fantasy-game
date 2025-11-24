package com.fantasy.scheduler;

import com.fantasy.application.FixtureService;
import com.fantasy.application.LiveScoreManager;
import com.fantasy.application.PointsService;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.infrastructure.repositories.FixtureRepository;
import com.fantasy.infrastructure.repositories.GameWeekRepository;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class LiveUpdatesScheduler {

    private final FixtureRepository fixtureRepository;
    private final GameWeekRepository gameweekRepository;
    private final FixtureService fixtureService;
    private final LiveScoreManager liveScoreManager;
    private final PointsService pointsService;
    private final UserGameDataRepository userGameDataRepository;

    public LiveUpdatesScheduler(FixtureRepository fixtureRepository,
                                GameWeekRepository gameweekRepository,
                                FixtureService fixtureService,
                                LiveScoreManager liveScoreManager,
                                PointsService pointsService,
                                UserGameDataRepository userGameDataRepository) {
        this.fixtureRepository = fixtureRepository;
        this.gameweekRepository = gameweekRepository;
        this.fixtureService = fixtureService;
        this.liveScoreManager = liveScoreManager;
        this.pointsService = pointsService;
        this.userGameDataRepository = userGameDataRepository;
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
            fixtureService.updateFixturesForGameweek(gwId);

            liveScoreManager.updateLiveScores(gwId);

            userGameDataRepository.findAll().forEach(userGameData -> {
                try {
                    pointsService.calculateAndPersist(userGameData.getUser().getId(), gwId);
                } catch (Exception e) {
                    System.err.println("Failed to calc live points for user " + userGameData.getId());
                }
            });
        }
    }
}