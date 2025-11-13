package com.fantasy.application;

import com.fantasy.domain.player.*;
import com.fantasy.dto.PlayerDto;
import com.fantasy.main.InMemoryData;
import com.fantasy.infrastructure.mappers.PlayerMapper;
import com.fantasy.infrastructure.repositories.*;
import com.fantasy.domain.score.ScoreCalculator;
import com.fantasy.domain.scoreEvent.ScoreEvent;
import com.fantasy.domain.scoreEvent.ScoreType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PlayerService {

    private final PlayerRepository playerRepo;
    private final PlayerPointsRepository pointsRepo;
    private final PlayerGameweekStatsRepository statsRepo;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String FPL_API_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";
    private static final String FPL_PLAYER_URL = "https://fantasy.premierleague.com/api/element-summary/";

    public PlayerService(PlayerRepository playerRepo,
                         PlayerPointsRepository pointsRepo,
                         PlayerGameweekStatsRepository statsRepo) {
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.statsRepo = statsRepo;
    }

    public void loadPlayersFromApi() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(FPL_API_URL, String.class);
            JsonNode root = mapper.readTree(response.getBody());
            JsonNode elements = root.get("elements");

            for (JsonNode node : elements) {
                if (!node.get("can_select").asBoolean()) continue;

                int teamId = node.get("team").asInt();

                PlayerEntity entity = playerRepo.findById(node.get("id").asInt())
                        .orElse(new PlayerEntity());

                entity.setId(node.get("id").asInt());
                entity.setFirstName(node.get("first_name").asText());
                entity.setLastName(node.get("second_name").asText());
                entity.setViewName(node.get("web_name").asText());
                entity.setPosition(PlayerPosition.fromId(node.get("element_type").asInt()));
                entity.setTeamId(teamId);
                entity.setInjured(!node.get("status").asText().equals("a"));
                entity.setOwnerId(-1);
                entity.setState(PlayerState.NONE);
                entity.setTotalPoints(0);

                entity.setNews(node.hasNonNull("news") ? node.get("news").asText() : null);
                entity.setChanceOfPlayingThisRound(
                        node.has("chance_of_playing_this_round") && !node.get("chance_of_playing_this_round").isNull()
                                ? node.get("chance_of_playing_this_round").asInt()
                                : null
                );
                entity.setChanceOfPlayingNextRound(
                        node.has("chance_of_playing_next_round") && !node.get("chance_of_playing_next_round").isNull()
                                ? node.get("chance_of_playing_next_round").asInt()
                                : null
                );
                if (node.hasNonNull("news_added")) {
                    String raw = node.get("news_added").asText();
                    try {
                        entity.setNewsAdded(LocalDateTime.parse(raw.replace("Z", "")));
                    } catch (Exception ignore) {}
                }

                playerRepo.save(entity);

                Player domainPlayer = InMemoryData.getPlayers().getById(entity.getId());
                if (domainPlayer == null) {
                    domainPlayer = new Player(
                            entity.getId(),
                            entity.getFirstName(),
                            entity.getLastName(),
                            entity.getPosition(),
                            entity.getTeamId(),
                            entity.getViewName()
                    );
                }

                String historyUrl = FPL_PLAYER_URL + entity.getId() + "/";
                ResponseEntity<String> historyRes = restTemplate.getForEntity(historyUrl, String.class);
                JsonNode history = mapper.readTree(historyRes.getBody()).get("history");

                pointsRepo.deleteAll(pointsRepo.findByPlayer_Id(entity.getId()));

                int totalPoints = 0;

                if (history == null || history.isEmpty()) {
                    PlayerPointsEntity zero = new PlayerPointsEntity();
                    zero.setPlayer(entity);
                    zero.setGameweek(1);
                    zero.setPoints(0);
                    pointsRepo.save(zero);
                    continue;
                }

                for (JsonNode gw : history) {
                    int round = gw.get("round").asInt();
                    int minutes = gw.get("minutes").asInt();
                    int goals = gw.get("goals_scored").asInt();
                    int assists = gw.get("assists").asInt();
                    int yellow = gw.get("yellow_cards").asInt();
                    int red = gw.get("red_cards").asInt();
                    int ownGoals = gw.get("own_goals").asInt();
                    int pensSaved = gw.get("penalties_saved").asInt();
                    int pensMissed = gw.get("penalties_missed").asInt();
                    int goalsConceded = gw.get("goals_conceded").asInt();
                    int starts = gw.get("starts").asInt();

                    List<ScoreEvent> events = new ArrayList<>();

                    if (minutes > 0) {
                        if (starts == 1)
                            events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PLAYED));
                        else
                            events.add(new ScoreEvent(domainPlayer, 0, ScoreType.FROM_BENCH));
                    }

                    for (int i = 0; i < goals; i++) {
                        ScoreEvent ev = new ScoreEvent(domainPlayer, 0, ScoreType.GOAL);
                        ev.setGoalIndex(i + 1);
                        events.add(ev);
                    }

                    for (int i = 0; i < assists; i++)
                        events.add(new ScoreEvent(domainPlayer, 0, ScoreType.ASSIST));

                    if (minutes >= 30 && goalsConceded == 0)
                        events.add(new ScoreEvent(domainPlayer, minutes, ScoreType.CLEAN_SHEET));

                    if (goalsConceded > 0) {
                        ScoreEvent ev = new ScoreEvent(domainPlayer, minutes, ScoreType.GOAL_CONCEDED);
                        ev.setGoalsConceded(goalsConceded);
                        events.add(ev);
                    }

                    for (int i = 0; i < yellow; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.YELLOW_CARD));
                    for (int i = 0; i < red; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.RED_CARD));
                    for (int i = 0; i < ownGoals; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.OWN_GOAL));
                    for (int i = 0; i < pensSaved; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PENALTY_SAVE));
                    for (int i = 0; i < pensMissed; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PENALTY_MISS));

                    int gwPoints = ScoreCalculator.calculatePointsForPlayer(events);

                    PlayerGameweekStatsEntity stats = statsRepo
                            .findByPlayer_IdAndGameweek(entity.getId(), round)
                            .orElseGet(PlayerGameweekStatsEntity::new);

                    stats.setPlayer(entity);
                    stats.setGameweek(round);
                    stats.setOpponentTeamId(gw.get("opponent_team").asInt());
                    stats.setWasHome(gw.get("was_home").asBoolean());
                    stats.setMinutesPlayed(minutes);
                    stats.setGoals(goals);
                    stats.setAssists(assists);
                    stats.setGoalsConceded(goalsConceded);
                    stats.setYellowCards(yellow);
                    stats.setRedCards(red);
                    stats.setPenaltiesSaved(pensSaved);
                    stats.setPenaltiesMissed(pensMissed);

                    boolean cleanSheet = goalsConceded == 0 && minutes >= 30;
                    stats.setCleanSheet(cleanSheet);
                    stats.setCleanSheet30(minutes >= 30 && goalsConceded == 0);
                    stats.setCleanSheet45(minutes >= 45 && goalsConceded == 0);
                    stats.setCleanSheet60(minutes >= 60 && goalsConceded == 0);

                    stats.setStarted(starts == 1);
                    stats.setTotalPoints(gwPoints);
                    statsRepo.save(stats);

                    PlayerPointsEntity pp = pointsRepo.findByPlayer_IdAndGameweek(entity.getId(), round)
                            .orElseGet(PlayerPointsEntity::new);
                    pp.setPlayer(entity);
                    pp.setGameweek(round);
                    pp.setPoints(gwPoints);
                    pointsRepo.save(pp);

                    totalPoints += gwPoints;
                }

                entity.setTotalPoints(totalPoints);
                playerRepo.save(entity);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void updateCurrentGameweekPoints(int currentGw) {
        try {
            List<PlayerEntity> players = playerRepo.findAll();

            for (PlayerEntity entity : players) {
                String historyUrl = FPL_PLAYER_URL + entity.getId() + "/";
                ResponseEntity<String> historyRes = restTemplate.getForEntity(historyUrl, String.class);
                JsonNode history = mapper.readTree(historyRes.getBody()).get("history");

                if (history == null || history.isEmpty()) {
                    PlayerPointsEntity emptyPoints = pointsRepo
                            .findByPlayer_IdAndGameweek(entity.getId(), currentGw)
                            .orElseGet(() -> {
                                PlayerPointsEntity pp = new PlayerPointsEntity();
                                pp.setPlayer(entity);
                                pp.setGameweek(currentGw);
                                return pp;
                            });
                    emptyPoints.setPoints(0);
                    pointsRepo.save(emptyPoints);
                    continue;
                }

                JsonNode latest = null;
                for (JsonNode gw : history) {
                    int round = gw.get("round").asInt();
                    if (round == currentGw) {
                        latest = gw;
                        break;
                    }
                }

                if (latest == null) {
                    PlayerPointsEntity emptyPoints = pointsRepo
                            .findByPlayer_IdAndGameweek(entity.getId(), currentGw)
                            .orElseGet(() -> {
                                PlayerPointsEntity pp = new PlayerPointsEntity();
                                pp.setPlayer(entity);
                                pp.setGameweek(currentGw);
                                return pp;
                            });
                    emptyPoints.setPoints(0);
                    pointsRepo.save(emptyPoints);
                    continue;
                }

                int minutes = latest.get("minutes").asInt();
                int goals = latest.get("goals_scored").asInt();
                int assists = latest.get("assists").asInt();
                int yellow = latest.get("yellow_cards").asInt();
                int red = latest.get("red_cards").asInt();
                int ownGoals = latest.get("own_goals").asInt();
                int pensSaved = latest.get("penalties_saved").asInt();
                int pensMissed = latest.get("penalties_missed").asInt();
                int goalsConceded = latest.get("goals_conceded").asInt();
                int starts = latest.get("starts").asInt();

                Player domainPlayer = InMemoryData.getPlayers().getById(entity.getId());
                if (domainPlayer == null)
                    continue;

                List<ScoreEvent> events = new ArrayList<>();

                if (minutes > 0) {
                    if (starts == 1)
                        events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PLAYED));
                    else
                        events.add(new ScoreEvent(domainPlayer, 0, ScoreType.FROM_BENCH));
                }

                for (int i = 0; i < goals; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.GOAL));
                for (int i = 0; i < assists; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.ASSIST));

                if (minutes >= 30 && goalsConceded == 0)
                    events.add(new ScoreEvent(domainPlayer, minutes, ScoreType.CLEAN_SHEET));

                if (goalsConceded > 0) {
                    ScoreEvent ev = new ScoreEvent(domainPlayer, minutes, ScoreType.GOAL_CONCEDED);
                    ev.setGoalsConceded(goalsConceded);
                    events.add(ev);
                }

                for (int i = 0; i < yellow; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.YELLOW_CARD));
                for (int i = 0; i < red; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.RED_CARD));
                for (int i = 0; i < ownGoals; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.OWN_GOAL));
                for (int i = 0; i < pensSaved; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PENALTY_SAVE));
                for (int i = 0; i < pensMissed; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PENALTY_MISS));

                int gwPoints = ScoreCalculator.calculatePointsForPlayer(events);

                PlayerGameweekStatsEntity stats = statsRepo
                        .findByPlayer_IdAndGameweek(entity.getId(), currentGw)
                        .orElseGet(PlayerGameweekStatsEntity::new);

                stats.setPlayer(entity);
                stats.setGameweek(currentGw);
                stats.setOpponentTeamId(latest.get("opponent_team").asInt());
                stats.setWasHome(latest.get("was_home").asBoolean());
                stats.setMinutesPlayed(minutes);
                stats.setGoals(goals);
                stats.setAssists(assists);
                stats.setGoalsConceded(goalsConceded);
                stats.setYellowCards(yellow);
                stats.setRedCards(red);
                stats.setPenaltiesSaved(latest.get("penalties_saved").asInt());
                stats.setPenaltiesMissed(latest.get("penalties_missed").asInt());

                boolean cleanSheet = goalsConceded == 0 && minutes >= 30;
                stats.setCleanSheet(cleanSheet);
                stats.setCleanSheet30(minutes >= 30 && goalsConceded == 0);
                stats.setCleanSheet45(minutes >= 45 && goalsConceded == 0);
                stats.setCleanSheet60(minutes >= 60 && goalsConceded == 0);

                stats.setStarted(starts == 1);

                stats.setTotalPoints(gwPoints);
                statsRepo.save(stats);

                PlayerPointsEntity existing = pointsRepo
                        .findByPlayer_IdAndGameweek(entity.getId(), currentGw)
                        .orElseGet(() -> {
                            PlayerPointsEntity pp = new PlayerPointsEntity();
                            pp.setPlayer(entity);
                            pp.setGameweek(currentGw);
                            return pp;
                        });

                existing.setPoints(gwPoints);
                pointsRepo.save(existing);

                int total = pointsRepo.findByPlayer_Id(entity.getId())
                        .stream()
                        .mapToInt(PlayerPointsEntity::getPoints)
                        .sum();

                entity.setTotalPoints(total);
                playerRepo.save(entity);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void updateLiveGameweekStats(int currentGw) {
        try {
            String url = "https://fantasy.premierleague.com/api/event/" + currentGw + "/live/";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root = mapper.readTree(response.getBody());
            JsonNode elements = root.get("elements");
            if (elements == null || !elements.isArray()) return;

            Map<Integer, PlayerEntity> playerMap = playerRepo.findAll().stream()
                    .collect(Collectors.toMap(PlayerEntity::getId, p -> p));

            for (JsonNode element : elements) {
                int playerId = element.get("id").asInt();
                JsonNode statsNode = element.get("stats");
                if (statsNode == null) continue;

                int minutes = statsNode.get("minutes").asInt();
                int goals = statsNode.get("goals_scored").asInt();
                int assists = statsNode.get("assists").asInt();
                int yellow = statsNode.get("yellow_cards").asInt();
                int red = statsNode.get("red_cards").asInt();
                int ownGoals = statsNode.get("own_goals").asInt();
                int pensSaved = statsNode.get("penalties_saved").asInt();
                int pensMissed = statsNode.get("penalties_missed").asInt();
                int goalsConceded = statsNode.get("goals_conceded").asInt();
                int cleanSheets = statsNode.get("clean_sheets").asInt();
                int starts = statsNode.get("starts").asInt();
                int totalPoints = statsNode.get("total_points").asInt();

                PlayerEntity entity = playerMap.get(playerId);
                if (entity == null) continue;

                Player domainPlayer = InMemoryData.getPlayers().getById(playerId);
                if (domainPlayer == null) continue;

                List<ScoreEvent> events = new ArrayList<>();

                if (minutes > 0) {
                    if (starts == 1)
                        events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PLAYED));
                    else
                        events.add(new ScoreEvent(domainPlayer, 0, ScoreType.FROM_BENCH));
                }

                for (int i = 0; i < goals; i++) {
                    ScoreEvent ev = new ScoreEvent(domainPlayer, 0, ScoreType.GOAL);
                    ev.setGoalIndex(i + 1);
                    events.add(ev);
                }

                for (int i = 0; i < assists; i++)
                    events.add(new ScoreEvent(domainPlayer, 0, ScoreType.ASSIST));

                if (minutes >= 30 && goalsConceded == 0)
                    events.add(new ScoreEvent(domainPlayer, minutes, ScoreType.CLEAN_SHEET));

                if (goalsConceded > 0) {
                    ScoreEvent ev = new ScoreEvent(domainPlayer, minutes, ScoreType.GOAL_CONCEDED);
                    ev.setGoalsConceded(goalsConceded);
                    events.add(ev);
                }

                for (int i = 0; i < yellow; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.YELLOW_CARD));
                for (int i = 0; i < red; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.RED_CARD));
                for (int i = 0; i < ownGoals; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.OWN_GOAL));
                for (int i = 0; i < pensSaved; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PENALTY_SAVE));
                for (int i = 0; i < pensMissed; i++) events.add(new ScoreEvent(domainPlayer, 0, ScoreType.PENALTY_MISS));

                int calculatedPoints = ScoreCalculator.calculatePointsForPlayer(events);
                int finalPoints = totalPoints > 0 ? totalPoints : calculatedPoints;

                PlayerGameweekStatsEntity stats = statsRepo
                        .findByPlayer_IdAndGameweek(playerId, currentGw)
                        .orElseGet(PlayerGameweekStatsEntity::new);

                stats.setPlayer(entity);
                stats.setGameweek(currentGw);
                stats.setMinutesPlayed(minutes);
                stats.setGoals(goals);
                stats.setAssists(assists);
                stats.setGoalsConceded(goalsConceded);
                stats.setYellowCards(yellow);
                stats.setRedCards(red);
                stats.setPenaltiesSaved(pensSaved);
                stats.setPenaltiesMissed(pensMissed);
                stats.setCleanSheet(cleanSheets > 0);
                stats.setCleanSheet30(minutes >= 30 && cleanSheets > 0);
                stats.setCleanSheet45(minutes >= 45 && cleanSheets > 0);
                stats.setCleanSheet60(minutes >= 60 && cleanSheets > 0);
                stats.setStarted(starts == 1);
                stats.setTotalPoints(finalPoints);
                statsRepo.save(stats);

                PlayerPointsEntity points = pointsRepo
                        .findByPlayer_IdAndGameweek(playerId, currentGw)
                        .orElseGet(PlayerPointsEntity::new);
                points.setPlayer(entity);
                points.setGameweek(currentGw);
                points.setPoints(finalPoints);
                pointsRepo.save(points);

                int cumulative = pointsRepo.findByPlayer_Id(entity.getId())
                        .stream().mapToInt(PlayerPointsEntity::getPoints).sum();
                entity.setTotalPoints(cumulative);
                playerRepo.save(entity);

                domainPlayer.getPointsByGameweek().put(currentGw, finalPoints);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<PlayerDto> getAllPlayers() {
        List<PlayerPointsEntity> allPoints = pointsRepo.findAll();

        Map<Integer, List<PlayerPointsEntity>> pointsByPlayer =
                allPoints.stream().collect(Collectors.groupingBy(p -> p.getPlayer().getId()));

        return playerRepo.findAll().stream()
                .map(p -> PlayerMapper.toDto(p, pointsByPlayer.getOrDefault(p.getId(), List.of())))
                .collect(Collectors.toList());
    }

    public long countPlayers() {
        return playerRepo.count();
    }

}
