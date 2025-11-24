package com.fantasy.application;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPointsEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.dto.PlayerDataDto;
import com.fantasy.infrastructure.repositories.PlayerPointsRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PlayerDataService {

    private final UserSquadRepository userSquadRepo;
    private final PlayerPointsRepository playerPointsRepo;
    private final FixtureService fixtureService;
    private final PlayerRegistry playerRegistry;

    public PlayerDataService(UserSquadRepository userSquadRepo,
                             PlayerPointsRepository playerPointsRepo,
                             FixtureService fixtureService,
                             PlayerRegistry playerRegistry) {
        this.userSquadRepo = userSquadRepo;
        this.playerPointsRepo = playerPointsRepo;
        this.fixtureService = fixtureService;
        this.playerRegistry = playerRegistry;
    }

    public List<PlayerDataDto> getSquadDataForGameweek(int userId, int gwId) {
        UserSquadEntity squadEntity = userSquadRepo.findByUser_IdAndGameweek(userId, gwId)
                .orElseThrow(() -> new RuntimeException("No squad found for user " + userId + " in GW " + gwId));

        List<FixtureEntity> gwFixtures = fixtureService.getFixturesByGameweek(gwId);

        Map<Integer, List<FixtureEntity>> teamFixturesMap = new HashMap<>();
        for (FixtureEntity f : gwFixtures) {
            teamFixturesMap.computeIfAbsent(f.getHomeTeamId(), k -> new ArrayList<>()).add(f);
            teamFixturesMap.computeIfAbsent(f.getAwayTeamId(), k -> new ArrayList<>()).add(f);
        }

        List<Integer> playerIds = new ArrayList<>();
        if (squadEntity.getStartingLineup() != null) playerIds.addAll(squadEntity.getStartingLineup());
        if (squadEntity.getBenchMap() != null) playerIds.addAll(squadEntity.getBenchMap().values());

        return playerIds.stream()
                .map(id -> {
                    Player player = playerRegistry.findById(id);
                    if (player == null) return new PlayerDataDto(id, 0, null);

                    List<FixtureEntity> myFixtures = teamFixturesMap.getOrDefault(player.getTeamId(), List.of());

                    boolean hasStarted = myFixtures.stream().anyMatch(FixtureEntity::isStarted);

                    Integer points = null;
                    String nextFixture = null;

                    if (hasStarted) {
                        Optional<PlayerPointsEntity> pointsOpt = playerPointsRepo.findByPlayer_IdAndGameweek(id, gwId);
                        points = pointsOpt.map(PlayerPointsEntity::getPoints).orElse(0);
                    } else {
                        nextFixture = fixtureService.getNextFixtureDisplayForTeam(player.getTeamId());
                    }

                    return new PlayerDataDto(id, points, nextFixture);
                })
                .toList();
    }
}