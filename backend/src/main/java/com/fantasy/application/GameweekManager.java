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

import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GameweekManager {

    private static final Logger log = LoggerFactory.getLogger(GameweekManager.class);

    private final UserGameDataRepository gameDataRepository;
    private final UserSquadRepository squadRepository;
    private final GameWeekRepository gameweekRepository;
    private final PlayerGameweekStatsRepository statsRepo;
    private final PointsService pointsService;
    private final PlayerRegistry playerRegistry;
    private final SystemStatusService systemStatusService;

    public GameweekManager(UserGameDataRepository gameDataRepository,
                           UserSquadRepository squadRepository,
                           GameWeekRepository gameweekRepository,
                           PlayerGameweekStatsRepository statsRepo,
                           PointsService pointsService,
                           PlayerRegistry playerRegistry,
                           SystemStatusService systemStatusService) {
        this.gameDataRepository = gameDataRepository;
        this.squadRepository = squadRepository;
        this.gameweekRepository = gameweekRepository;
        this.statsRepo = statsRepo;
        this.pointsService = pointsService;
        this.playerRegistry = playerRegistry;
        this.systemStatusService = systemStatusService;
    }

    @Transactional
    public void openNextGameweek(int newGwId, boolean isSuperAdmin) {

        systemStatusService.setRolloverInProgress(true);
        log.info("SYSTEM LOCKED: Starting rollover to GW {}", newGwId);

        try {
            log.info("Attempting to open next gameweek: GW {}", newGwId);

            boolean openedSuccessfully = updateGameweeksStatus(newGwId);

            if (!openedSuccessfully && !isSuperAdmin) {
                log.warn("openNextGameweek: GW {} was not opened (status was not UPCOMING)", newGwId);
                return;
            }

            var gameDataEntities = gameDataRepository.findAllWithRelations();
            log.info("Loaded {} users for GW rollover", gameDataEntities.size());

            for (UserGameDataEntity gameDataEntity : gameDataEntities) {

                var userGameData = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

                GameweekRollover.rolloverToNextGameweek(userGameData, newGwId);

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

            log.info("Successfully opened GW {} and rolled over all squads", newGwId);
        }finally {
            systemStatusService.setRolloverInProgress(false);
            log.info("SYSTEM UNLOCKED: Finished rollover to GW {}", newGwId);
        }
    }

    @Transactional
    public void processGameweek(int gameweekId, boolean isSuperAdmin) {
        log.info("Processing GW {}", gameweekId);

        var gw = gameweekRepository.findByIdWithLock(gameweekId)
                .orElseThrow(() -> {
                    log.error("processGameweek: GW {} not found", gameweekId);
                    return new RuntimeException("Gameweek not found");
                });

        if (gw.isCalculated() && !isSuperAdmin) {
            log.warn("processGameweek: GW {} already marked as calculated, skipping", gameweekId);
            return;
        }

        Map<Integer, Integer> minutesMap = statsRepo.findAll().stream()
                .filter(s -> s.getGameweek() == gameweekId)
                .collect(Collectors.toMap(
                        s -> s.getPlayer().getId(),
                        PlayerGameweekStatsEntity::getMinutesPlayed,
                        (a, b) -> b
                ));

        log.debug("Loaded minutes for {} players for GW {}", minutesMap.size(), gameweekId);

        var gameDataEntities = gameDataRepository.findAllWithRelations();

        for (UserGameDataEntity gameDataEntity : gameDataEntities) {

            UserGameData userGameData = UserMapper.toDomainGameData(gameDataEntity, playerRegistry);

            var squadEntity = squadRepository
                    .findByUser_IdAndGameweek(userGameData.getId(), gameweekId)
                    .orElse(null);

            if (squadEntity == null) {
                log.error("No squad found for user {} in GW {}", userGameData.getId(), gameweekId);
                throw new RuntimeException("Squad not found for userGameData " + userGameData.getId() + " for GW " + gameweekId);
            }

            Squad squad = SquadMapper.toDomain(squadEntity, playerRegistry);

            squad.autoSub(minutesMap);

            UserSquadEntity updatedEntity = SquadMapper.toEntity(squad, gameweekId);
            updatedEntity.setId(squadEntity.getId());
            updatedEntity.setUser(gameDataEntity);

            squadRepository.save(updatedEntity);


            pointsService.calculateAndPersist(userGameData.getId(), gameweekId);
        }

        gw.setCalculated(true);
        gameweekRepository.save(gw);

        log.info("Finished processing GW {} successfully", gameweekId);
    }

    private boolean updateGameweeksStatus(int newGwId) {
        var nextGw = gameweekRepository.findByIdWithLock(newGwId)
                .orElseThrow(() -> {
                    log.error("updateGameweeksStatus: Next GW {} not found", newGwId);
                    return new RuntimeException("Next gameweek not found: " + newGwId);
                });

        if (!"UPCOMING".equalsIgnoreCase(nextGw.getStatus())) {
            log.warn("GW {} is already {}. Cannot open.", newGwId, nextGw.getStatus());
            return false;
        }

        var currentLiveOpt = gameweekRepository.findFirstByStatusOrderByIdAsc("LIVE");
        if (currentLiveOpt.isPresent()) {
            var currentLive = currentLiveOpt.get();
            currentLive.setStatus("FINISHED");
            log.info("Marked GW {} as FINISHED", currentLive.getId());
            gameweekRepository.save(currentLive);
        }

        nextGw.setStatus("LIVE");
        gameweekRepository.save(nextGw);

        gameweekRepository.flush();

        log.info("GW {} is now LIVE", newGwId);

        return true;
    }
}