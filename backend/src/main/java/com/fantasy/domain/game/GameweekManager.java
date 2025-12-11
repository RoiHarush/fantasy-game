package com.fantasy.domain.game;

import com.fantasy.domain.score.PointsService;
import com.fantasy.application.SystemStatusService;
import com.fantasy.domain.team.Squad;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.team.UserGameData;
import com.fantasy.domain.team.UserGameDataEntity;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.player.PlayerGameweekStatsRepository;

import com.fantasy.domain.team.SquadMapper;
import com.fantasy.domain.user.UserMapper;
import com.fantasy.domain.team.UserGameDataRepository;
import com.fantasy.domain.team.UserSquadRepository;

import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
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

    // תוספות חדשות
    private final GameweekDailyStatusRepository dailyStatusRepository;
    private final FixtureRepository fixtureRepository;

    public GameweekManager(UserGameDataRepository gameDataRepository,
                           UserSquadRepository squadRepository,
                           GameWeekRepository gameweekRepository,
                           PlayerGameweekStatsRepository statsRepo,
                           PointsService pointsService,
                           PlayerRegistry playerRegistry,
                           SystemStatusService systemStatusService,
                           GameweekDailyStatusRepository dailyStatusRepository,
                           FixtureRepository fixtureRepository) {
        this.gameDataRepository = gameDataRepository;
        this.squadRepository = squadRepository;
        this.gameweekRepository = gameweekRepository;
        this.statsRepo = statsRepo;
        this.pointsService = pointsService;
        this.playerRegistry = playerRegistry;
        this.systemStatusService = systemStatusService;
        this.dailyStatusRepository = dailyStatusRepository;
        this.fixtureRepository = fixtureRepository;
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
        } finally {
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

        markAllDaysAsCalculated(gameweekId);

        log.info("Finished processing GW {} successfully", gameweekId);
    }

    private void markAllDaysAsCalculated(int gwId) {
        List<LocalDate> matchDates = fixtureRepository.findMatchDatesByGameweekId(gwId);

        for (LocalDate date : matchDates) {
            GameweekDailyStatus status = dailyStatusRepository
                    .findByGameweekIdAndMatchDate(gwId, date)
                    .orElseGet(() -> new GameweekDailyStatus(gwId, date));

            if (!status.isCalculated()) {
                status.markAsCalculated();
                dailyStatusRepository.save(status);
                log.info("Marked date {} in GW {} as calculated (Final process).", date, gwId);
            }
        }
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