package com.fantasy.application;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerPointsEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.score.ScoreCalculator;

import com.fantasy.domain.scoreEvent.ScoreEvent;
import com.fantasy.domain.scoreEvent.ScoreType;
import com.fantasy.infrastructure.repositories.PlayerGameweekStatsRepository;
import com.fantasy.infrastructure.repositories.PlayerPointsRepository;
import com.fantasy.infrastructure.repositories.PlayerRepository;
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
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public LiveScoreManager(PlayerGameweekStatsRepository statsRepository,
                            PlayerPointsRepository pointsRepository,
                            PlayerRegistry playerRegistry,
                            PlayerRepository playerRepository,
                            RestTemplate restTemplate,
                            ObjectMapper mapper) {
        this.statsRepository = statsRepository;
        this.pointsRepository = pointsRepository;
        this.playerRegistry = playerRegistry;
        this.playerRepository = playerRepository;
        this.restTemplate = restTemplate;
        this.mapper = mapper;
    }

    @Transactional
    public void updateLiveScores(int gameweekId) {
        log.info("Starting live score update for GW {}", gameweekId);

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

                PlayerGameweekStatsEntity dbStats = statsMap.get(playerId);
                boolean isNewRecord = false;

                if (dbStats == null) {

                    if (playerRegistry.findById(playerId) == null) {
                        continue;
                    }

                    log.info("Creating new stats entry for player {} (GW {})", playerId, gameweekId);

                    dbStats = new PlayerGameweekStatsEntity();
                    dbStats.setPlayer(playerRepository.getReferenceById(playerId));
                    dbStats.setGameweek(gameweekId);
                    dbStats.setMinutesPlayed(0); dbStats.setGoals(0); dbStats.setAssists(0); dbStats.setGoalsConceded(0);
                    dbStats.setYellowCards(0); dbStats.setRedCards(0); dbStats.setPenaltiesSaved(0); dbStats.setPenaltiesMissed(0);
                    dbStats.setOwnGoals(0); dbStats.setCleanSheet(false); dbStats.setCleanSheet30(false);
                    dbStats.setCleanSheet45(false); dbStats.setCleanSheet60(false); dbStats.setStarted(false); dbStats.setTotalPoints(0);

                    isNewRecord = true;
                }

                if (isNewRecord || hasStatsChanged(dbStats, apiStats)) {

                    updateStatsFromApi(dbStats, apiStats);

                    int newPoints = calculateLivePoints(dbStats);
                    dbStats.setTotalPoints(newPoints);

                    statsToUpdate.add(dbStats);

                    Player domainPlayer = playerRegistry.findById(playerId);
                    if (domainPlayer != null) {
                        domainPlayer.getPointsByGameweek().put(gameweekId, newPoints);
                    }

                    PlayerPointsEntity pointEntity = pointsRepository
                            .findByPlayer_IdAndGameweek(playerId, gameweekId)
                            .orElseGet(() -> {
                                log.info("Creating PlayerPointsEntity for player {} GW {}", playerId, gameweekId);
                                PlayerPointsEntity newP = new PlayerPointsEntity();
                                newP.setPlayer(playerRepository.getReferenceById(playerId));
                                newP.setGameweek(gameweekId);
                                return newP;
                            });

                    pointEntity.setPoints(newPoints);
                    pointsToUpdate.add(pointEntity);
                }
            }

            if (!statsToUpdate.isEmpty()) {
                statsRepository.saveAll(statsToUpdate);
                pointsRepository.saveAll(pointsToUpdate);
                log.info("Live update finished → {} stats updated, {} point entries updated",
                        statsToUpdate.size(), pointsToUpdate.size());
            } else {
                log.info("Live update finished → No changes detected for GW {}", gameweekId);
            }

        } catch (Exception e) {
            log.error("Error during live score update for GW {}: {}", gameweekId, e.getMessage(), e);
        }
    }

    private boolean hasStatsChanged(PlayerGameweekStatsEntity db, JsonNode api) {
        int dbStartedAsInt = db.isStarted() ? 1 : 0;
        int apiStarted = api.has("starts") ? api.get("starts").asInt() : 0;

        return db.getMinutesPlayed() != api.get("minutes").asInt() ||
                db.getGoals() != api.get("goals_scored").asInt() ||
                db.getAssists() != api.get("assists").asInt() ||
                db.getYellowCards() != api.get("yellow_cards").asInt() ||
                db.getRedCards() != api.get("red_cards").asInt() ||
                db.getGoalsConceded() != api.get("goals_conceded").asInt() ||
                db.getPenaltiesSaved() != api.get("penalties_saved").asInt() ||
                db.getPenaltiesMissed() != api.get("penalties_missed").asInt() ||
                db.getOwnGoals() != api.get("own_goals").asInt() ||
                dbStartedAsInt != apiStarted;
    }

    private void updateStatsFromApi(PlayerGameweekStatsEntity db, JsonNode api) {
        int minutes = api.get("minutes").asInt();
        int goalsConceded = api.get("goals_conceded").asInt();
        int starts = api.has("starts") ? api.get("starts").asInt() : 0;

        db.setMinutesPlayed(minutes);
        db.setGoals(api.get("goals_scored").asInt());
        db.setAssists(api.get("assists").asInt());
        db.setYellowCards(api.get("yellow_cards").asInt());
        db.setRedCards(api.get("red_cards").asInt());
        db.setGoalsConceded(goalsConceded);
        db.setPenaltiesSaved(api.get("penalties_saved").asInt());
        db.setPenaltiesMissed(api.get("penalties_missed").asInt());
        db.setOwnGoals(api.get("own_goals").asInt());
        db.setStarted(starts == 1);

        boolean isCleanSheet30 = goalsConceded == 0 && minutes >= 30;
        db.setCleanSheet(isCleanSheet30);
        db.setCleanSheet30(isCleanSheet30);
        db.setCleanSheet45(goalsConceded == 0 && minutes >= 45);
        db.setCleanSheet60(goalsConceded == 0 && minutes >= 60);
    }

    private int calculateLivePoints(PlayerGameweekStatsEntity stats) {
        Player domainPlayer = playerRegistry.findById(stats.getPlayer().getId());
        if (domainPlayer == null) return 0;

        List<ScoreEvent> events = new ArrayList<>();

        if (stats.getMinutesPlayed() > 0) {
            if (stats.isStarted()) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PLAYED));
            else events.add(new ScoreEvent(domainPlayer, 0, ScoreType.FROM_BENCH));
        }
        for (int i = 0; i < stats.getGoals(); i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.GOAL));
        for (int i = 0; i < stats.getAssists(); i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.ASSIST));
        if (stats.isCleanSheet()) events.add(new ScoreEvent(domainPlayer, stats.getMinutesPlayed(), ScoreType.CLEAN_SHEET));
        if (stats.getGoalsConceded() > 0) {
            ScoreEvent ev = new ScoreEvent(domainPlayer, stats.getMinutesPlayed(), ScoreType.GOAL_CONCEDED);
            ev.setGoalsConceded(stats.getGoalsConceded());
            events.add(ev);
        }
        for (int i = 0; i < stats.getYellowCards(); i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.YELLOW_CARD));
        for (int i = 0; i < stats.getRedCards(); i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.RED_CARD));
        for (int i = 0; i < stats.getOwnGoals(); i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.OWN_GOAL));
        for (int i = 0; i < stats.getPenaltiesSaved(); i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PENALTY_SAVE));
        for (int i = 0; i < stats.getPenaltiesMissed(); i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PENALTY_MISS));

        return ScoreCalculator.calculatePointsForPlayer(events);
    }
}
