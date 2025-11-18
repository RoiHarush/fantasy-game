package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.*;
import com.fantasy.infrastructure.repositories.PlayerPointsRepository;
import com.fantasy.infrastructure.repositories.UserPointsRepository;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.domain.fantasyTeam.FantasyTeam;

import com.fantasy.infrastructure.repositories.UserSquadRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;


@Service
public class PointsService {

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

        UserGameDataEntity gameDataEntity = gameDataRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("UserGameData entity not found"));

        UserSquadEntity squadEntity = userSquadRepo.findByUser_IdAndGameweek(gameDataEntity.getId(), gw)
                .orElseThrow(() -> new RuntimeException("Squad snapshot not found for gw " + gw));

        Squad squad = SquadMapper.toDomain(squadEntity, playerRegistry);
        FantasyTeam team = new FantasyTeam(gw, squad);

        int points = team.calculatePoints();

        UserPointsEntity pointsEntity = userPointsRepo.findByUser_IdAndGameweek(gameDataEntity.getId(), gw) // <-- שימוש ב-ID הנכון
                .orElseGet(() -> {
                    UserPointsEntity up = new UserPointsEntity();
                    up.setUser(gameDataEntity);
                    up.setGameweek(gw);
                    return up;
                });

        pointsEntity.setPoints(points);
        userPointsRepo.save(pointsEntity);

        int totalPoints = userPointsRepo.sumPointsByUserId(gameDataEntity.getId());
        gameDataEntity.setTotalPoints(totalPoints);

        gameDataRepo.save(gameDataEntity);

        return points;
    }


    public int getUserPointsForGameWeek(int userId, int gw) {
        var gameDataEntity = gameDataRepo.findByUserId(userId);

        if (gameDataEntity.isEmpty()) {
            return 0;
        }

        return userPointsRepo.findByUser_IdAndGameweek(gameDataEntity.get().getId(), gw)
                .map(UserPointsEntity::getPoints)
                .orElse(0);
    }
}