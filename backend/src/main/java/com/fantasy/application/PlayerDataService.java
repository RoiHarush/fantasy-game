package com.fantasy.application;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPointsEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.dto.PlayerDataDto;
import com.fantasy.infrastructure.repositories.PlayerPointsRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

        List<Integer> playerIds = new ArrayList<>();

        if (squadEntity.getStartingLineup() != null)
            playerIds.addAll(squadEntity.getStartingLineup());

        if (squadEntity.getBenchMap() != null)
            playerIds.addAll(squadEntity.getBenchMap().values());

        return playerIds.stream()
                .map(id -> {
                    Player player = playerRegistry.findById(id);
                    if (player == null)
                        return new PlayerDataDto(id, 0, null);

                    Optional<PlayerPointsEntity> pointsOpt = playerPointsRepo.findByPlayer_IdAndGameweek(id, gwId);
                    Integer points = pointsOpt.map(PlayerPointsEntity::getPoints).orElse(null);

                    String nextFixture = null;
                    if (points == null) {
                        nextFixture = fixtureService.getNextFixtureDisplayForTeam(player.getTeamId());
                    }

                    return new PlayerDataDto(id, points, nextFixture);
                })
                .toList();
    }

}
