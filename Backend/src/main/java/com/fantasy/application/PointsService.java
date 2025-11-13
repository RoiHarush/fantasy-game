package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.infrastructure.repositories.PlayerPointsRepository;
import com.fantasy.infrastructure.repositories.UserPointsRepository;
import com.fantasy.main.InMemoryData;
import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.repositories.UserRepository;
import com.fantasy.domain.user.User;
import com.fantasy.domain.fantasyTeam.FantasyTeam;

import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserPointsEntity;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;


@Service
public class PointsService {

    private final UserRepository userRepo;
    private final UserSquadRepository userSquadRepo;
    private final UserPointsRepository userPointsRepo;
    private final GameWeekService gameWeekService;
    private final PlayerPointsRepository playerPointsRepo;

    public PointsService(UserRepository userRepo,
                         UserSquadRepository userSquadRepo,
                         UserPointsRepository userPointsRepo,
                         GameWeekService gameWeekService,
                         PlayerPointsRepository playerPointsRepo) {
        this.userRepo = userRepo;
        this.userSquadRepo = userSquadRepo;
        this.userPointsRepo = userPointsRepo;
        this.gameWeekService = gameWeekService;
        this.playerPointsRepo = playerPointsRepo;
    }

    @Transactional
    public int calculateAndPersist(int userId, int gw) {

        User user = InMemoryData.getUsers().getById(userId);
        if (user == null) throw new RuntimeException("User not found");

        FantasyTeam team;
        if (gw == gameWeekService.getCurrentGameweek().getId()) {
            team = user.getCurrentFantasyTeam();
        } else if (gw == gameWeekService.getNextGameweek().getId()) {
            team = user.getNextFantasyTeam();
        } else {
            UserSquadEntity squadEntity = userSquadRepo.findByUser_IdAndGameweek(userId, gw)
                    .orElseThrow(() -> new RuntimeException("Squad snapshot not found for gw " + gw));
            Squad squad = SquadMapper.toDomain(squadEntity, InMemoryData.getPlayers());
            team = new FantasyTeam(gw, squad);
        }

        if (team == null) throw new RuntimeException("Team not found for gw " + gw);

        int points = team.calculatePoints();
        user.getPointsByGameweek().put(gw, points);

        UserEntity userEntity = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("UserEntity not found in DB"));

        UserPointsEntity pointsEntity = userPointsRepo.findByUser_IdAndGameweek(userId, gw)
                .orElseGet(() -> {
                    UserPointsEntity up = new UserPointsEntity();
                    up.setUser(userEntity);
                    up.setGameweek(gw);
                    return up;
                });

        pointsEntity.setPoints(points);
        userPointsRepo.save(pointsEntity);

        int totalPoints = userPointsRepo.sumPointsByUserId(userId);
        userEntity.setTotalPoints(totalPoints);
        userRepo.save(userEntity);

        return points;
    }


    public int getUserPointsForGameWeek(int userId, int gw) {
        return userPointsRepo.findByUser_IdAndGameweek(userId, gw)
                .map(UserPointsEntity::getPoints)
                .orElse(0);
    }

}