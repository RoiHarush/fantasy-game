package com.fantasy.domain.score;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.game.FixtureRepository;
import com.fantasy.domain.player.*;
import com.fantasy.domain.player.RawGameStats;
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
    private final PlayerFixtureStatsRepository fixtureStatsRepository;
    private final PlayerPointsRepository pointsRepository;
    private final PlayerRepository playerRepository;
    private final PlayerStatsUpdater statsUpdater;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final FixtureRepository fixtureRepository;

    public LiveScoreManager(PlayerGameweekStatsRepository statsRepository,
                            PlayerFixtureStatsRepository fixtureStatsRepository,
                            PlayerPointsRepository pointsRepository,
                            PlayerRepository playerRepository,
                            PlayerStatsUpdater statsUpdater,
                            RestTemplate restTemplate,
                            ObjectMapper mapper,
                            FixtureRepository fixtureRepository) {
        this.statsRepository = statsRepository;
        this.fixtureStatsRepository = fixtureStatsRepository;
        this.pointsRepository = pointsRepository;
        this.playerRepository = playerRepository;
        this.statsUpdater = statsUpdater;
        this.restTemplate = restTemplate;
        this.mapper = mapper;
        this.fixtureRepository = fixtureRepository;
    }

    @Transactional
    public void updateLiveScores(int gameweekId) {
        log.debug("Starting live score update for GW {}", gameweekId);
            List<FixtureEntity> fixtures = fixtureRepository.findByGameweekId(gameweekId);
            Map<Integer, FixtureEntity> fixturesById = fixtures.stream()
                    .collect(Collectors.toMap(FixtureEntity::getId, Function.identity()));
            Map<Integer, Integer> teamToOpponentMap = new HashMap<>();
            Map<Integer, Boolean> teamToWasHomeMap = new HashMap<>();

            for (FixtureEntity fixture : fixtures) {
                teamToOpponentMap.put(fixture.getHomeTeamId(), fixture.getAwayTeamId());
                teamToWasHomeMap.put(fixture.getHomeTeamId(), true);

                teamToOpponentMap.put(fixture.getAwayTeamId(), fixture.getHomeTeamId());
                teamToWasHomeMap.put(fixture.getAwayTeamId(), false);
            }

            String url = LIVE_API_URL.replace("{event_id}", String.valueOf(gameweekId));
            JsonNode root;
            try {
                root = mapper.readTree(restTemplate.getForObject(url, String.class));
            } catch (Exception exception) {
                throw new IllegalStateException("Invalid live-score response for GW " + gameweekId, exception);
            }
            JsonNode elements = root.get("elements");

            List<PlayerGameweekStatsEntity> allDbStats = statsRepository.findByGameweek(gameweekId);
            Map<Integer, PlayerGameweekStatsEntity> statsMap =
                    allDbStats.stream().collect(Collectors.toMap(s -> s.getPlayer().getId(), Function.identity()));
            Map<Integer, PlayerEntity> playersById = playerRepository.findAll().stream()
                    .collect(Collectors.toMap(PlayerEntity::getId, Function.identity()));
            Map<String, PlayerFixtureStatsEntity> fixtureStatsMap = fixtureStatsRepository.findByGameweek(gameweekId)
                    .stream()
                    .collect(Collectors.toMap(
                            stats -> fixtureStatsKey(stats.getPlayer().getId(), stats.getFixture().getId()),
                            Function.identity()
                    ));

            List<PlayerGameweekStatsEntity> statsToUpdate = new ArrayList<>();
            List<PlayerFixtureStatsEntity> fixtureStatsToUpdate = new ArrayList<>();
            List<PlayerPointsEntity> pointsToUpdate = new ArrayList<>();
            for (JsonNode apiPlayer : elements) {
                int playerId = apiPlayer.get("id").asInt();
                JsonNode apiStats = apiPlayer.get("stats");

                PlayerEntity playerEntity = playersById.get(playerId);
                if (playerEntity == null) continue;
                Player domainPlayer = PlayerMapper.toDomain(playerEntity, null);

                RawGameStats rawStats = parseRawStats(apiStats);
                List<PlayerFixtureStatsEntity> currentPlayerFixtureStats = new ArrayList<>();

                JsonNode explanations = apiPlayer.get("explain");
                if (explanations != null && explanations.isArray()) {
                    for (JsonNode explanation : explanations) {
                        int fixtureId = explanation.path("fixture").asInt(0);
                        FixtureEntity fixture = fixturesById.get(fixtureId);
                        if (fixture == null) continue;

                        String key = fixtureStatsKey(playerId, fixtureId);
                        PlayerFixtureStatsEntity fixtureStats = fixtureStatsMap.get(key);
                        if (fixtureStats == null) {
                            fixtureStats = new PlayerFixtureStatsEntity();
                            fixtureStats.setPlayer(playerEntity);
                            fixtureStats.setFixture(fixture);
                            fixtureStats.setGameweek(gameweekId);
                            fixtureStatsMap.put(key, fixtureStats);
                        }

                        RawGameStats fixtureRawStats = parseFixtureRawStats(
                                explanation.path("stats"),
                                playerEntity.getTeamId(),
                                fixture
                        );
                        statsUpdater.update(fixtureStats, fixtureRawStats);
                        currentPlayerFixtureStats.add(fixtureStats);
                        fixtureStatsToUpdate.add(fixtureStats);
                    }
                }

                PlayerGameweekStatsEntity dbStats = statsMap.get(playerId);
                boolean isNewRecord = false;

                if (dbStats == null) {
                    dbStats = new PlayerGameweekStatsEntity();
                    dbStats.setPlayer(playerRepository.getReferenceById(playerId));
                    dbStats.setGameweek(gameweekId);

                    Integer opponentId = teamToOpponentMap.get(domainPlayer.getTeamId());
                    Boolean wasHome = teamToWasHomeMap.get(domainPlayer.getTeamId());

                    if (opponentId != null) {
                        dbStats.setOpponentTeamId(opponentId);
                        dbStats.setWasHome(wasHome);
                    } else {
                        dbStats.setOpponentTeamId(0);
                    }

                    isNewRecord = true;
                }

                boolean aggregateChanged = isNewRecord || hasStatsChanged(dbStats, rawStats);
                if (aggregateChanged) {
                    statsUpdater.update(dbStats, rawStats);

                    // אופציונלי: לוודא שגם בעדכון קיים היריבה מעודכנת (למקרה שהיה 0 קודם)
                    if (dbStats.getOpponentTeamId() == 0 && teamToOpponentMap.containsKey(domainPlayer.getTeamId())) {
                        dbStats.setOpponentTeamId(teamToOpponentMap.get(domainPlayer.getTeamId()));
                        dbStats.setWasHome(teamToWasHomeMap.get(domainPlayer.getTeamId()));
                    }

                }

                if (!currentPlayerFixtureStats.isEmpty()) {
                    int perFixtureTotal = currentPlayerFixtureStats.stream()
                            .mapToInt(PlayerFixtureStatsEntity::getTotalPoints)
                            .sum();
                    if (dbStats.getTotalPoints() != perFixtureTotal) {
                        dbStats.setTotalPoints(perFixtureTotal);
                        aggregateChanged = true;
                    }
                }

                if (aggregateChanged) {
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
            }
            if (!fixtureStatsToUpdate.isEmpty()) {
                fixtureStatsRepository.saveAll(fixtureStatsToUpdate);
                log.debug("Live update: Updated {} player fixture rows.", fixtureStatsToUpdate.size());
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
                starts > 0,
                0,
                false
        );
    }

    private RawGameStats parseFixtureRawStats(JsonNode stats,
                                              int playerTeamId,
                                              FixtureEntity fixture) {
        Map<String, Integer> values = new HashMap<>();
        if (stats != null && stats.isArray()) {
            for (JsonNode stat : stats) {
                String identifier = stat.path("identifier").asText("");
                if (!identifier.isBlank()) values.put(identifier, stat.path("value").asInt(0));
            }
        }

        boolean wasHome = fixture.getHomeTeamId() == playerTeamId;
        int opponentTeamId = wasHome ? fixture.getAwayTeamId() : fixture.getHomeTeamId();
        int minutes = values.getOrDefault("minutes", 0);
        return new RawGameStats(
                minutes,
                values.getOrDefault("goals_scored", 0),
                values.getOrDefault("assists", 0),
                values.getOrDefault("goals_conceded", 0),
                values.getOrDefault("yellow_cards", 0),
                values.getOrDefault("red_cards", 0),
                values.getOrDefault("penalties_saved", 0),
                values.getOrDefault("penalties_missed", 0),
                values.getOrDefault("own_goals", 0),
                values.getOrDefault("starts", minutes > 0 ? 1 : 0) > 0,
                opponentTeamId,
                wasHome
        );
    }

    private String fixtureStatsKey(int playerId, int fixtureId) {
        return playerId + ":" + fixtureId;
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
