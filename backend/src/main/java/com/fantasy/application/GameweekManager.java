package com.fantasy.application;

import com.fantasy.domain.fantasyTeam.Squad;
import com.fantasy.domain.game.GameweekRollover;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.user.UserGameData;
import com.fantasy.domain.user.UserGameDataEntity;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.infrastructure.repositories.PlayerGameweekStatsRepository;

import com.fantasy.infrastructure.mappers.SquadMapper;
import com.fantasy.infrastructure.mappers.UserMapper;
import com.fantasy.infrastructure.repositories.GameWeekRepository;
import com.fantasy.infrastructure.repositories.UserGameDataRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GameweekManager {

    private final UserGameDataRepository gameDataRepository;
    private final UserSquadRepository squadRepository;
    private final GameWeekRepository gameweekRepository;
    private final PlayerGameweekStatsRepository statsRepo;
    private final PointsService pointsService;
    private final PlayerRegistry playerRegistry;

    public GameweekManager(UserGameDataRepository gameDataRepository,
                           UserSquadRepository squadRepository,
                           GameWeekRepository gameweekRepository,
                           PlayerGameweekStatsRepository statsRepo,
                           PointsService pointsService,
                           PlayerRegistry playerRegistry) {
        this.gameDataRepository = gameDataRepository;
        this.squadRepository = squadRepository;
        this.gameweekRepository = gameweekRepository;
        this.statsRepo = statsRepo;
        this.pointsService = pointsService;
        this.playerRegistry = playerRegistry;
    }

    @Transactional
    public void openNextGameweek(int newGw) {
        var gameDataEntities = gameDataRepository.findAllWithRelations();

        for (UserGameDataEntity gameDataEntity : gameDataEntities) {
            var userGameData = UserMapper.toDomainGameData(
                    gameDataEntity,
                    playerRegistry
            );

            GameweekRollover.rolloverToNextGameweek(userGameData, newGw);

            var newNextSquadEntity = SquadMapper.toEntity(
                    userGameData.getNextFantasyTeam().getSquad(),
                    userGameData.getNextFantasyTeam().getGameweek()
            );
            newNextSquadEntity.setUser(gameDataEntity);
            squadRepository.save(newNextSquadEntity);

            gameDataEntity.setCurrentSquad(gameDataEntity.getNextSquad());
            gameDataEntity.setNextSquad(newNextSquadEntity);

            gameDataRepository.save(gameDataEntity);
        }

        updateGameweeksStatus(newGw);
    }

    @Transactional
    public void processGameweek(int gameweekId) {
        Map<Integer, Integer> minutesMap = statsRepo.findAll().stream()
                .filter(s -> s.getGameweek() == gameweekId)
                .collect(Collectors.toMap(
                        s -> s.getPlayer().getId(),
                        PlayerGameweekStatsEntity::getMinutesPlayed,
                        (a, b) -> b
                ));

        var gameDataEntities = gameDataRepository.findAllWithRelations();

        for (UserGameDataEntity gameDataEntity : gameDataEntities) {
            UserGameData userGameData = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

            Squad squad = userGameData.getCurrentFantasyTeam().getSquad();

            squad.autoSub(minutesMap);

            var squadEntity = gameDataEntity.getCurrentSquad();
            if (squadEntity == null || squadEntity.getGameweek() != gameweekId) {
                throw new RuntimeException("Squad entity not found for userGameData " + userGameData.getId() + " for GW " + gameweekId);
            }

            UserSquadEntity updatedEntity = SquadMapper.toEntity(squad, gameweekId);
            updatedEntity.setId(squadEntity.getId());
            updatedEntity.setUser(gameDataEntity);

            squadRepository.save(updatedEntity);

            pointsService.calculateAndPersist(userGameData.getId(), gameweekId);
        }
    }

    private void updateGameweeksStatus(int newGw) {
        var nextGw = gameweekRepository.findById(newGw)
                .orElseThrow(() -> new RuntimeException("Next gameweek not found"));
        var prevGw = gameweekRepository.findById(newGw - 1)
                .orElseThrow(() -> new RuntimeException("Previous gameweek not found"));

        prevGw.setStatus("FINISHED");
        nextGw.setStatus("LIVE");

        gameweekRepository.save(prevGw);
        gameweekRepository.save(nextGw);
    }
}
