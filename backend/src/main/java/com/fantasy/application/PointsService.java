package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.*;
import com.fantasy.dto.GameweekHistoryDto;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.PlayerPointsRepository;
import com.fantasy.infrastructure.repositories.UserPointsRepository;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.domain.fantasyTeam.FantasyTeam;

import com.fantasy.infrastructure.repositories.UserSquadRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class PointsService {

    private static final Logger log = LoggerFactory.getLogger(PointsService.class);

    private final UserGameDataRepository gameDataRepo;
    private final UserSquadRepository userSquadRepo;
    private final UserPointsRepository userPointsRepo;
    private final GameWeekService gameWeekService;
    private final PlayerPointsRepository playerPointsRepo;
    private final PlayerRegistry playerRegistry;

    public PointsService(UserGameDataRepository gameDataRepo,
                         UserSquadRepository userSquadRepo,
                         UserPointsRepository userPointsRepo,
                         GameWeekService gameWeekService,
                         PlayerPointsRepository playerPointsRepo,
                         PlayerRegistry playerRegistry) {
        this.gameDataRepo = gameDataRepo;
        this.userSquadRepo = userSquadRepo;
        this.userPointsRepo = userPointsRepo;
        this.gameWeekService = gameWeekService;
        this.playerPointsRepo = playerPointsRepo;
        this.playerRegistry = playerRegistry;
    }

    @Transactional
    public int calculateAndPersist(int userId, int gw) {
        log.info("Calculating points → user={}, gw={}", userId, gw);

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

        Squad squad = SquadMapper.toDomain(squadEntity, playerRegistry);
        FantasyTeam team = new FantasyTeam(gw, squad);

        int points = team.calculatePoints();
        log.info("GW {} points for user {} = {}", gw, userId, points);

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
        log.info("Updated total points → user={}, total={}", userId, totalPoints);

        gameDataEntity.setTotalPoints(totalPoints);
        gameDataRepo.save(gameDataEntity);

        log.info("Finished persisting points → user={}, gw={}", userId, gw);

        return points;
    }

    public int getUserPointsForGameWeek(int userId, int gw) {
        log.info("Fetching points for user {} in GW {}", userId, gw);

        var gameDataEntity = gameDataRepo.findByUserId(userId);

        if (gameDataEntity.isEmpty()) {
            log.warn("getUserPointsForGameWeek: No game data found for user {}", userId);
            return 0;
        }

        int result = userPointsRepo.findByUser_IdAndGameweek(gameDataEntity.get().getId(), gw)
                .map(UserPointsEntity::getPoints)
                .orElse(0);

        log.info("Points result → user={}, gw={}, points={}", userId, gw, result);

        return result;
    }

    public int getUserTotalPoints(int userId) {
        log.info("Fetching total points for user {}", userId);

        return gameDataRepo.findByUserId(userId)
                .map(e -> {
                    int total = UserMapper.toDomainGameData(e, playerRegistry).getTotalPoints();
                    log.info("Total points result → user={}, total={}", userId, total);
                    return total;
                })
                .orElse(0);
    }

    public List<GameweekHistoryDto> getUserHistory(Integer userId) {
        log.info("Fetching user history for user {}", userId);

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

        log.info("History built → user={}, entries={}", userId, history.size());

        return history;
    }
}