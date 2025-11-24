package com.fantasy.application;

import com.fantasy.domain.player.*;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.dto.PlayerAssistedDto;
import com.fantasy.dto.PlayerDto;
import com.fantasy.dto.UpdateAssistRequest;
import com.fantasy.infrastructure.mappers.PlayerMapper;
import com.fantasy.infrastructure.repositories.*;
import com.fantasy.domain.score.ScoreCalculator;
import com.fantasy.domain.scoreEvent.ScoreEvent;
import com.fantasy.domain.scoreEvent.ScoreType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class PlayerService {

    private final PlayerRepository playerRepo;
    private final PlayerPointsRepository pointsRepo;
    private final PlayerGameweekStatsRepository statsRepo;
    private final PlayerRegistry playerRegistry;
    private final UserRepository userRepo;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final String FPL_API_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";
    private static final String FPL_PLAYER_URL = "https://fantasy.premierleague.com/api/element-summary/";

    public PlayerService(PlayerRepository playerRepo,
                         PlayerPointsRepository pointsRepo,
                         PlayerGameweekStatsRepository statsRepo,
                         PlayerRegistry playerRegistry,
                         UserRepository userRepo) {
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.statsRepo = statsRepo;
        this.playerRegistry = playerRegistry;
        this.userRepo = userRepo;
    }

    @Transactional
    public void loadPlayersFromApi() {
        long startTime = System.currentTimeMillis();
        System.out.println("Starting optimized player load (Parallel Mode)...");

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(FPL_API_URL, String.class);
            JsonNode root = mapper.readTree(response.getBody());
            JsonNode elements = root.get("elements");

            List<PlayerEntity> playersToSave = new ArrayList<>();

            for (JsonNode node : elements) {
                if (!node.get("can_select").asBoolean()) continue;

                PlayerEntity entity = new PlayerEntity();
                entity.setId(node.get("id").asInt());
                entity.setFirstName(node.get("first_name").asText());
                entity.setLastName(node.get("second_name").asText());
                entity.setViewName(node.get("web_name").asText());
                entity.setPosition(PlayerPosition.fromId(node.get("element_type").asInt()));
                entity.setTeamId(node.get("team").asInt());
                entity.setInjured(!node.get("status").asText().equals("a"));
                entity.setOwnerId(-1);
                entity.setState(PlayerState.NONE);
                entity.setTotalPoints(0);

                entity.setNews(node.hasNonNull("news") ? node.get("news").asText() : null);

                if (node.has("chance_of_playing_this_round") && !node.get("chance_of_playing_this_round").isNull()) {
                    entity.setChanceOfPlayingThisRound(node.get("chance_of_playing_this_round").asInt());
                }
                if (node.has("chance_of_playing_next_round") && !node.get("chance_of_playing_next_round").isNull()) {
                    entity.setChanceOfPlayingNextRound(node.get("chance_of_playing_next_round").asInt());
                }
                if (node.hasNonNull("news_added")) {
                    try {
                        String raw = node.get("news_added").asText();
                        entity.setNewsAdded(LocalDateTime.parse(raw.replace("Z", "")));
                    } catch (Exception ignore) {}
                }

                playersToSave.add(entity);
            }

            System.out.println("Saving " + playersToSave.size() + " players to DB...");
            playerRepo.saveAll(playersToSave);

            List<PlayerGameweekStatsEntity> allStatsToSave = Collections.synchronizedList(new ArrayList<>());
            List<PlayerPointsEntity> allPointsToSave = Collections.synchronizedList(new ArrayList<>());

            ExecutorService executor = Executors.newFixedThreadPool(20);
            List<CompletableFuture<Void>> futures = new ArrayList<>();
            AtomicInteger counter = new AtomicInteger(0);

            System.out.println("Fetching history for all players in parallel...");

            for (PlayerEntity player : playersToSave) {
                CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                    try {
                        processPlayerHistory(player, allStatsToSave, allPointsToSave);

                        int current = counter.incrementAndGet();
                        if (current % 100 == 0) {
                            System.out.println("Processed history for " + current + "/" + playersToSave.size() + " players.");
                        }
                    } catch (Exception e) {
                        System.err.println("Error processing player " + player.getId() + ": " + e.getMessage());
                    }
                }, executor);
                futures.add(future);
            }

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
            executor.shutdown();

            System.out.println("Calculating total points...");
            Map<Integer, Integer> playerTotalPoints = new HashMap<>();
            for (PlayerPointsEntity pp : allPointsToSave) {
                playerTotalPoints.merge(pp.getPlayer().getId(), pp.getPoints(), Integer::sum);
            }

            for (PlayerEntity p : playersToSave) {
                p.setTotalPoints(playerTotalPoints.getOrDefault(p.getId(), 0));
            }

            System.out.println("Saving all stats (" + allStatsToSave.size() + ") and points (" + allPointsToSave.size() + ")...");
            statsRepo.saveAll(allStatsToSave);
            pointsRepo.saveAll(allPointsToSave);
            playerRepo.saveAll(playersToSave);

            long duration = System.currentTimeMillis() - startTime;
            System.out.println("Finished loading players in " + (duration / 1000) + " seconds.");

        } catch (Exception e) {
            throw new RuntimeException("Failed to load players", e);
        }
    }

    private void processPlayerHistory(PlayerEntity player,
                                      List<PlayerGameweekStatsEntity> statsList,
                                      List<PlayerPointsEntity> pointsList) {
        try {
            String historyUrl = FPL_PLAYER_URL + player.getId() + "/";
            ResponseEntity<String> historyRes = restTemplate.getForEntity(historyUrl, String.class);
            JsonNode historyRoot = mapper.readTree(historyRes.getBody());
            JsonNode history = historyRoot.get("history");

            if (history == null || history.isEmpty()) {
                return;
            }

            Player domainPlayer = new Player(
                    player.getId(),
                    player.getFirstName(),
                    player.getLastName(),
                    player.getPosition(),
                    player.getTeamId(),
                    player.getViewName()
            );

            for (JsonNode gw : history) {
                int round = gw.get("round").asInt();
                int minutes = gw.get("minutes").asInt();
                int goals = gw.get("goals_scored").asInt();
                int assists = gw.get("assists").asInt();
                int goalsConceded = gw.get("goals_conceded").asInt();
                int starts = gw.get("starts").asInt();
                int yellow = gw.get("yellow_cards").asInt();
                int red = gw.get("red_cards").asInt();
                int ownGoals = gw.get("own_goals").asInt();
                int pensSaved = gw.get("penalties_saved").asInt();
                int pensMissed = gw.get("penalties_missed").asInt();

                List<ScoreEvent> events = new ArrayList<>();

                if (minutes > 0) {
                    events.add(new ScoreEvent(domainPlayer, 0, starts == 1 ? ScoreType.PLAYED : ScoreType.FROM_BENCH));
                }
                for (int i = 0; i < goals; i++) {
                    ScoreEvent ev = new ScoreEvent(domainPlayer, 0, ScoreType.GOAL);
                    ev.setGoalIndex(i + 1);
                    events.add(ev);
                }
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

                PlayerGameweekStatsEntity stats = new PlayerGameweekStatsEntity();
                stats.setPlayer(player);
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
                stats.setOwnGoals(ownGoals);

                stats.setCleanSheet(goalsConceded == 0 && minutes >= 30);
                stats.setCleanSheet30(minutes >= 30 && goalsConceded == 0);
                stats.setCleanSheet45(minutes >= 45 && goalsConceded == 0);
                stats.setCleanSheet60(minutes >= 60 && goalsConceded == 0);
                stats.setStarted(starts == 1);
                stats.setTotalPoints(gwPoints);

                PlayerPointsEntity pp = new PlayerPointsEntity();
                pp.setPlayer(player);
                pp.setGameweek(round);
                pp.setPoints(gwPoints);

                statsList.add(stats);
                pointsList.add(pp);
            }
        } catch (Exception e) {
            System.err.println("Failed to parse history for player " + player.getId() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void updateGameweekPoints(int currentGw) {
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

                Player domainPlayer = playerRegistry.findById(entity.getId());
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
                stats.setOwnGoals(ownGoals);

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

    public void refreshBasicPlayerData() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(FPL_API_URL, String.class);
            JsonNode root = mapper.readTree(response.getBody());
            JsonNode elements = root.get("elements");

            if (elements == null || !elements.isArray()) return;

            for (JsonNode node : elements) {

                int fplId = node.get("id").asInt();
                boolean canSelect = node.get("can_select").asBoolean();

                if (!canSelect) continue;

                Optional<PlayerEntity> optional = playerRepo.findById(fplId);

                PlayerEntity entity;

                if (optional.isPresent()) {
                    entity = optional.get();

                    entity.setFirstName(node.get("first_name").asText());
                    entity.setLastName(node.get("second_name").asText());
                    entity.setViewName(node.get("web_name").asText());

                    entity.setTeamId(node.get("team").asInt());

                    String status = node.get("status").asText();
                    entity.setInjured(!status.equals("a"));

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
                        try {
                            entity.setNewsAdded(
                                    LocalDateTime.parse(node.get("news_added").asText().replace("Z", ""))
                            );
                        } catch (Exception ignore) {}
                    }

                } else {
                    entity = new PlayerEntity();

                    entity.setId(fplId);
                    entity.setFirstName(node.get("first_name").asText());
                    entity.setLastName(node.get("second_name").asText());
                    entity.setViewName(node.get("web_name").asText());

                    int posId = node.get("element_type").asInt();
                    entity.setPosition(PlayerPosition.fromId(posId));

                    entity.setTeamId(node.get("team").asInt());

                    String status = node.get("status").asText();
                    entity.setInjured(!status.equals("a"));

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
                        try {
                            entity.setNewsAdded(
                                    LocalDateTime.parse(node.get("news_added").asText().replace("Z", ""))
                            );
                        } catch (Exception ignore) {}
                    }

                    entity.setOwnerId(-1);
                    entity.setState(PlayerState.NONE);
                    entity.setTotalPoints(0);
                }

                playerRepo.save(entity);
                Player domainPlayer = playerRegistry.findById(entity.getId());

                if (domainPlayer == null) {
                    domainPlayer = new Player(
                            entity.getId(),
                            entity.getFirstName(),
                            entity.getLastName(),
                            entity.getPosition(),
                            entity.getTeamId(),
                            entity.getViewName()
                    );
                    playerRegistry.add(domainPlayer);

                } else {
                    domainPlayer.setFirstName(entity.getFirstName());
                    domainPlayer.setLastName(entity.getLastName());
                    domainPlayer.setViewName(entity.getViewName());
                    domainPlayer.setTeamId(entity.getTeamId());
                    domainPlayer.setInjured(entity.isInjured());
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<PlayerAssistedDto> getPlayersAssistForGameWeek(int gwId){
        return statsRepo.findPlayersWithAssists(gwId);
    }

    @Transactional
    public PlayerAssistedDto updatePlayerAssist(UpdateAssistRequest request) {
        PlayerGameweekStatsEntity statsEntity = statsRepo.findByPlayer_IdAndGameweek(request.getPlayerId(), request.getGameweek())
                .orElseThrow(() -> new RuntimeException("Stats not found for player id: " + request.getPlayerId()));

        Player domainPlayer = PlayerMapper.toDomain(statsEntity.getPlayer(), null);

        ScoreEvent assistEvent = new ScoreEvent(domainPlayer, 0, ScoreType.ASSIST);
        int pointDelta = ScoreCalculator.calculatePoints(assistEvent);

        boolean isAdd = "ADD".equalsIgnoreCase(request.getAction());

        if (!isAdd && statsEntity.getAssists() <= 0) {
            throw new RuntimeException("Cannot remove assist from player with 0 assists");
        }

        if (isAdd) {
            statsEntity.setAssists(statsEntity.getAssists() + 1);
            statsEntity.setTotalPoints(statsEntity.getTotalPoints() + pointDelta);
        } else {
            statsEntity.setAssists(statsEntity.getAssists() - 1);
            statsEntity.setTotalPoints(statsEntity.getTotalPoints() - pointDelta);
        }
        statsRepo.save(statsEntity);

        PlayerPointsEntity pointsEntity = pointsRepo.findByPlayer_IdAndGameweek(request.getPlayerId(), request.getGameweek())
                .orElseThrow(() -> new RuntimeException("Points entity not found"));

        pointsEntity.setPoints(statsEntity.getTotalPoints());
        pointsRepo.save(pointsEntity);

        return new PlayerAssistedDto(
                statsEntity.getPlayer().getId(),
                statsEntity.getPlayer().getViewName(),
                statsEntity.getAssists(),
                statsEntity.getPlayer().getTeamId()
        );
    }

    @Transactional
    public PlayerDto togglePlayerLock(int playerId, boolean shouldLock) {
        PlayerEntity player = playerRepo.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        if (shouldLock) {
            if (player.getState() != PlayerState.NONE) {
                throw new RuntimeException("Can only lock players with state NONE");
            }
            player.setState(PlayerState.LOCKED);
        } else {
            if (player.getState() != PlayerState.LOCKED) {
                throw new RuntimeException("Can only unlock players with state LOCKED");
            }
            player.setState(PlayerState.NONE);
        }

        playerRepo.save(player);

        return PlayerMapper.toDto(player, null, null);
    }

    public List<PlayerDto> getLockedPlayers() {
        List<PlayerEntity> locked = playerRepo.findByState(PlayerState.LOCKED);
        return locked.stream()
                .map(p -> PlayerMapper.toDto(p, null, null))
                .collect(Collectors.toList());
    }

    public List<PlayerDto> getAllPlayers() {
        List<PlayerPointsEntity> allPoints = pointsRepo.findAll();
        Map<Integer, List<PlayerPointsEntity>> pointsByPlayer =
                allPoints.stream().collect(Collectors.groupingBy(p -> p.getPlayer().getId()));

        Map<Integer, String> ownerNameMap = userRepo.findAll().stream()
                .collect(Collectors.toMap(UserEntity::getId, UserEntity::getName));

        return playerRepo.findAll().stream()
                .map(p -> {
                    String ownerName = ownerNameMap.get(p.getOwnerId());

                    return PlayerMapper.toDto(
                            p,
                            pointsByPlayer.getOrDefault(p.getId(), List.of()),
                            ownerName
                    );
                })
                .collect(Collectors.toList());
    }

    public long countPlayers() {
        return playerRepo.count();
    }

}
