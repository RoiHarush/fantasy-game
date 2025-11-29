package com.fantasy.application;

import com.fantasy.domain.player.*;

import com.fantasy.dto.RawGameStats;
import com.fantasy.infrastructure.repositories.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class LiveScoreManager {

    private static final Logger log = LoggerFactory.getLogger(LiveScoreManager.class);
    private static final String LIVE_API_URL = "https://fantasy.premierleague.com/api/event/{event_id}/live/";

    private final PlayerGameweekStatsRepository statsRepository;
    private final PlayerPointsRepository pointsRepository;
    private final PlayerRegistry playerRegistry;
    private final PlayerRepository playerRepository;
    private final ScoringLogicService scoringLogic;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public LiveScoreManager(PlayerGameweekStatsRepository statsRepository,
                            PlayerPointsRepository pointsRepository,
                            PlayerRegistry playerRegistry,
                            PlayerRepository playerRepository,
                            ScoringLogicService scoringLogic,
                            RestTemplate restTemplate,
                            ObjectMapper mapper) {
        this.statsRepository = statsRepository;
        this.pointsRepository = pointsRepository;
        this.playerRegistry = playerRegistry;
        this.playerRepository = playerRepository;
        this.scoringLogic = scoringLogic;
        this.restTemplate = restTemplate;
        this.mapper = mapper;
    }

    @Transactional
    public void updateLiveScores(int gameweekId) {
        log.debug("Starting live score update for GW {}", gameweekId);

        try {
            String url = LIVE_API_URL.replace("{event_id}", String.valueOf(gameweekId));
            JsonNode root = mapper.readTree(restTemplate.getForObject(url, String.class));
            JsonNode elements = root.get("elements");

            List<PlayerGameweekStatsEntity> allDbStats = statsRepository.findByGameweek(gameweekId);
            Map<Integer, PlayerGameweekStatsEntity> statsMap =
                    allDbStats.stream().collect(Collectors.toMap(s -> s.getPlayer().getId(), Function.identity()));

            List<PlayerGameweekStatsEntity> statsToUpdate = new ArrayList<>();
            List<PlayerPointsEntity> pointsToUpdate = new ArrayList<>();

            for (JsonNode apiPlayer : elements) {
                int playerId = apiPlayer.get("id").asInt();
                JsonNode apiStats = apiPlayer.get("stats");

                Player domainPlayer = playerRegistry.findById(playerId);
                if (domainPlayer == null) continue;

                RawGameStats rawStats = parseRawStats(apiStats);

                PlayerGameweekStatsEntity dbStats = statsMap.get(playerId);
                boolean isNewRecord = false;

                if (dbStats == null) {
                    log.debug("Creating new stats entry for player {} (GW {})", playerId, gameweekId);
                    dbStats = new PlayerGameweekStatsEntity();
                    dbStats.setPlayer(playerRepository.getReferenceById(playerId));
                    dbStats.setGameweek(gameweekId);
                    isNewRecord = true;
                }

                if (isNewRecord || hasStatsChanged(dbStats, rawStats)) {


                    scoringLogic.updateStatsEntity(dbStats, domainPlayer, rawStats);

                    statsToUpdate.add(dbStats);

                    domainPlayer.getPointsByGameweek().put(gameweekId, dbStats.getTotalPoints());

                    PlayerPointsEntity pointEntity = pointsRepository
                            .findByPlayer_IdAndGameweek(playerId, gameweekId)
                            .orElseGet(() -> {
                                PlayerPointsEntity newP = new PlayerPointsEntity();
                                newP.setPlayer(playerRepository.getReferenceById(playerId));
                                newP.setGameweek(gameweekId);
                                return newP;
                            });

                    pointEntity.setPoints(dbStats.getTotalPoints());
                    pointsToUpdate.add(pointEntity);
                }
            }

            if (!statsToUpdate.isEmpty()) {
                statsRepository.saveAll(statsToUpdate);
                pointsRepository.saveAll(pointsToUpdate);
                log.info("Live update: Updated {} players.", statsToUpdate.size());
            } else {
                log.debug("Live update: No changes detected.");
            }

        } catch (Exception e) {
            log.error("Error updating live scores: {}", e.getMessage(), e);
        }
    }

    private RawGameStats parseRawStats(JsonNode api) {
        int starts = api.has("starts") ? api.get("starts").asInt() : 0;

        return new RawGameStats(
                api.get("minutes").asInt(),
                api.get("goals_scored").asInt(),
                api.get("assists").asInt(),
                api.get("goals_conceded").asInt(),
                api.get("yellow_cards").asInt(),
                api.get("red_cards").asInt(),
                api.get("penalties_saved").asInt(),
                api.get("penalties_missed").asInt(),
                api.get("own_goals").asInt(),
                starts == 1,
                0,
                false
        );
    }

    private boolean hasStatsChanged(PlayerGameweekStatsEntity db, RawGameStats raw) {
        int dbStarted = db.isStarted() ? 1 : 0;
        int rawStarted = raw.started() ? 1 : 0;

        return db.getMinutesPlayed() != raw.minutes() ||
                db.getGoals() != raw.goals() ||
                db.getAssists() != raw.assists() ||
                db.getYellowCards() != raw.yellowCards() ||
                db.getRedCards() != raw.redCards() ||
                db.getGoalsConceded() != raw.goalsConceded() ||
                db.getPenaltiesSaved() != raw.penaltiesSaved() ||
                db.getPenaltiesMissed() != raw.penaltiesMissed() ||
                db.getOwnGoals() != raw.ownGoals() ||
                dbStarted != rawStarted;
    }
}