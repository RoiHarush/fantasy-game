package com.fantasy.domain.score;

import com.fantasy.domain.team.*;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerGameweekStatsRepository;
import com.fantasy.domain.game.GameweekHistoryDto;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class PointsService {

    private static final Logger log = LoggerFactory.getLogger(PointsService.class);

    private final UserGameDataRepository gameDataRepo;
    private final UserSquadRepository userSquadRepo;
    private final UserPointsRepository userPointsRepo;
    private final PlayerGameweekStatsRepository statsRepo;
    private final LeagueScoringService leagueScoringService;

    public PointsService(UserGameDataRepository gameDataRepo,
                         UserSquadRepository userSquadRepo,
                         UserPointsRepository userPointsRepo,
                         PlayerGameweekStatsRepository statsRepo,
                         LeagueScoringService leagueScoringService) {
        this.gameDataRepo = gameDataRepo;
        this.userSquadRepo = userSquadRepo;
        this.userPointsRepo = userPointsRepo;
        this.statsRepo = statsRepo;
        this.leagueScoringService = leagueScoringService;
    }

    @Transactional
    public int calculateAndPersist(int userId, int gw) {
        log.info("Calculating points: user={}, gw={}", userId, gw);

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("calculateAndPersist: UserGameData not found for user {}", userId);
                    return new RuntimeException("UserGameData entity not found");
                });

        UserSquadEntity squadEntity = userSquadRepo.findByUser_IdAndGameweek(gameDataEntity.getId(), gw)
                .orElseThrow(() -> {
                    log.error("calculateAndPersist: Squad snapshot not found → user={}, gw={}", userId, gw);
                    return new RuntimeException("Squad snapshot not found for gw " + gw);
                });

        int points = calculateSquadPoints(gameDataEntity, squadEntity, gw);

        UserPointsEntity pointsEntity = userPointsRepo.findByUser_IdAndGameweek(gameDataEntity.getId(), gw)
                .orElseGet(() -> {
                    log.info("Creating new UserPointsEntity → user={}, gw={}", userId, gw);
                    UserPointsEntity up = new UserPointsEntity();
                    up.setUser(gameDataEntity);
                    up.setGameweek(gw);
                    return up;
                });

        pointsEntity.setPoints(points);
        userPointsRepo.save(pointsEntity);

        int totalPoints = userPointsRepo.sumPointsByUserId(gameDataEntity.getId());
        log.debug("Updated total points → user={}, total={}", userId, totalPoints);

        gameDataEntity.setTotalPoints(totalPoints);
        gameDataRepo.save(gameDataEntity);

        log.info("Finished persisting points → user={}, gw={}", userId, gw);

        return points;
    }

    public int getUserPointsForGameWeek(int userId, int gw) {
        log.debug("Fetching points for user {} in GW {}", userId, gw);

        var gameDataEntity = gameDataRepo.findByUserId(userId);

        if (gameDataEntity.isEmpty()) {
            log.warn("getUserPointsForGameWeek: No game data found for user {}", userId);
            return 0;
        }

        int result = userPointsRepo.findByUser_IdAndGameweek(gameDataEntity.get().getId(), gw)
                .map(UserPointsEntity::getPoints)
                .orElse(0);

        log.debug("Points result → user={}, gw={}, points={}", userId, gw, result);

        return result;
    }

    public int calculateLiveUserPoints(int userId, int gw) {
        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));

        UserSquadEntity squadEntity = userSquadRepo.findByUser_IdAndGameweek(gameDataEntity.getId(), gw)
                .orElseThrow(() -> new RuntimeException("Squad snapshot not found for gw " + gw));

        return calculateSquadPoints(gameDataEntity, squadEntity, gw);
    }

    public int getUserTotalPoints(int userId) {
        log.debug("Fetching total points for user {}", userId);

        return gameDataRepo.findByUserId(userId)
                .map(UserGameDataEntity::getTotalPoints)
                .orElse(0);
    }

    public List<GameweekHistoryDto> getUserHistory(Integer userId) {
        log.debug("Fetching user history for user {}", userId);

        UserGameDataEntity gameData = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> {
                    log.error("getUserHistory: No user data found → user={}", userId);
                    return new RuntimeException("User data not found for ID: " + userId);
                });

        List<UserPointsEntity> pointsList = gameData.getPointsByGameweek();
        pointsList.sort(Comparator.comparingInt(UserPointsEntity::getGameweek));

        List<GameweekHistoryDto> history = new ArrayList<>();
        int runningTotal = 0;

        for (UserPointsEntity p : pointsList) {
            runningTotal += p.getPoints();
            history.add(new GameweekHistoryDto(
                    p.getGameweek(),
                    p.getPoints(),
                    runningTotal
            ));
        }

        log.debug("History built → user={}, entries={}", userId, history.size());

        return history;
    }

    private int calculateSquadPoints(UserGameDataEntity gameData,
                                     UserSquadEntity squad,
                                     int gameweek) {
        if (gameData.getLeague() == null) {
            throw new IllegalStateException("User is not assigned to a league");
        }
        Map<Integer, PlayerGameweekStatsEntity> statsByPlayer = statsRepo.findByGameweek(gameweek)
                .stream()
                .collect(Collectors.toMap(
                        stats -> stats.getPlayer().getId(),
                        Function.identity(),
                        (first, second) -> second
                ));
        return leagueScoringService.calculateSquadPoints(gameData.getLeague(), squad, statsByPlayer);
    }
}
