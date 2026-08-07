package com.fantasy.domain.player;

import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.score.*;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PlayerSyncService {

    private static final Logger log = LoggerFactory.getLogger(PlayerSyncService.class);
    private static final String FPL_API_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";
    private static final String FPL_PLAYER_URL = "https://fantasy.premierleague.com/api/element-summary/";

    private final PlayerRepository playerRepo;
    private final PlayerPointsRepository pointsRepo;
    private final PlayerGameweekStatsRepository statsRepo;
    private final PlayerStatsUpdater statsUpdater;
    private final GameWeekService gameWeekService;
    private final PlayerSyncPersistenceService persistenceService;

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public PlayerSyncService(PlayerRepository playerRepo,
                             PlayerPointsRepository pointsRepo,
                             PlayerGameweekStatsRepository statsRepo,
                             PlayerStatsUpdater statsUpdater,
                             GameWeekService gameWeekService,
                             PlayerSyncPersistenceService persistenceService,
                             RestTemplate restTemplate,
                             ObjectMapper mapper) {
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.statsRepo = statsRepo;
        this.statsUpdater = statsUpdater;
        this.gameWeekService = gameWeekService;
        this.persistenceService = persistenceService;
        this.restTemplate = restTemplate;
        this.mapper = mapper;
    }


    private record PlayerLoadResult(
            List<PlayerEntity> playersToSave,
            List<PlayerGameweekStatsEntity> allStatsToSave,
            List<PlayerPointsEntity> allPointsToSave
    ) {}

    public void loadPlayersFromApi() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(FPL_API_URL, String.class);
            loadPlayersFromBootstrap(mapper.readTree(response.getBody()));
        } catch (Exception e) {
            log.error("Failed to load players: {}", e.getMessage());
            throw new RuntimeException("Failed to load players", e);
        }
    }

    public void loadPlayersFromBootstrap(JsonNode bootstrapRoot) {
        long startTime = System.currentTimeMillis();
        log.info("Starting optimized player load (Parallel Mode)...");

        try {
            PlayerLoadResult result = fetchPlayersAndHistoryData(bootstrapRoot);
            persistenceService.persistInitialLoad(
                    result.playersToSave(),
                    result.allStatsToSave(),
                    result.allPointsToSave()
            );
            long duration = System.currentTimeMillis() - startTime;
            log.info("Finished loading players in {} seconds.", (duration / 1000));
        } catch (Exception e) {
            log.error("Failed to load players: {}", e.getMessage());
            throw new RuntimeException("Failed to load players", e);
        }
    }

    private PlayerLoadResult fetchPlayersAndHistoryData(JsonNode root) throws Exception {
        if (root == null || !root.hasNonNull("elements") || !root.get("elements").isArray()) {
            throw new IllegalArgumentException("FPL bootstrap response does not contain players");
        }
        JsonNode elements = root.get("elements");

        List<PlayerEntity> playersToProcess = new ArrayList<>();

        for (JsonNode node : elements) {
            if (!node.get("can_select").asBoolean()) continue;
            playersToProcess.add(mapJsonToEntity(node));
        }

        List<PlayerGameweekStatsEntity> allStatsToSave = Collections.synchronizedList(new ArrayList<>());
        List<PlayerPointsEntity> allPointsToSave = Collections.synchronizedList(new ArrayList<>());

        List<CompletableFuture<Void>> futures = new ArrayList<>();
        AtomicInteger counter = new AtomicInteger(0);

        log.info("Fetching history for all players in parallel...");

        try (ExecutorService executor = Executors.newFixedThreadPool(8)) {
            for (PlayerEntity player : playersToProcess) {
                CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                    try {
                        processPlayerHistory(player, allStatsToSave, allPointsToSave);
                        counter.incrementAndGet();
                    } catch (Exception e) {
                        throw new CompletionException(
                                "Failed to load history for player " + player.getId(),
                                e
                        );
                    }
                }, executor);
                futures.add(future);
            }

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        }

        Map<Integer, Integer> playerTotalPoints = new HashMap<>();
        for (PlayerPointsEntity pp : allPointsToSave) {
            playerTotalPoints.merge(pp.getPlayer().getId(), pp.getPoints(), Integer::sum);
        }
        for (PlayerEntity p : playersToProcess) {
            p.setTotalPoints(playerTotalPoints.getOrDefault(p.getId(), 0));
        }

        return new PlayerLoadResult(playersToProcess, allStatsToSave, allPointsToSave);
    }

    private void processPlayerHistory(PlayerEntity player,
                                      List<PlayerGameweekStatsEntity> statsList,
                                      List<PlayerPointsEntity> pointsList) throws Exception {
        String historyUrl = FPL_PLAYER_URL + player.getId() + "/";
        ResponseEntity<String> historyRes = restTemplate.getForEntity(historyUrl, String.class);
        JsonNode historyRoot = mapper.readTree(historyRes.getBody());
        JsonNode history = historyRoot.get("history");

        if (history == null || history.isEmpty()) return;

        for (JsonNode gw : history) {
            RawGameStats rawStats = mapJsonToRawStats(gw);

            PlayerGameweekStatsEntity stats = new PlayerGameweekStatsEntity();
            stats.setPlayer(player);
            stats.setGameweek(gw.get("round").asInt());
            statsUpdater.update(stats, rawStats);
            statsList.add(stats);

            PlayerPointsEntity pp = new PlayerPointsEntity();
            pp.setPlayer(player);
            pp.setGameweek(stats.getGameweek());
            pp.setPoints(stats.getTotalPoints());
            pointsList.add(pp);
        }
    }

    @Transactional
    public void updateGameweekPoints(int currentGw) {
        try {
            List<PlayerEntity> players = playerRepo.findAll();
            log.info("Updating live GW {} points for {} players", currentGw, players.size());

            for (PlayerEntity entity : players) {
                String historyUrl = FPL_PLAYER_URL + entity.getId() + "/";
                ResponseEntity<String> historyRes = restTemplate.getForEntity(historyUrl, String.class);
                JsonNode historyNode = mapper.readTree(historyRes.getBody()).get("history");

                JsonNode latest = null;
                if (historyNode != null && !historyNode.isEmpty()) {
                    for (JsonNode gw : historyNode) {
                        if (gw.get("round").asInt() == currentGw) {
                            latest = gw;
                            break;
                        }
                    }
                }

                if (latest == null) {
                    pointsRepo.findByPlayer_IdAndGameweek(entity.getId(), currentGw)
                            .ifPresent(pp -> { pp.setPoints(0); pointsRepo.save(pp); });
                    continue;
                }

                RawGameStats rawStats = mapJsonToRawStats(latest);

                PlayerGameweekStatsEntity stats = statsRepo.findByPlayer_IdAndGameweek(entity.getId(), currentGw)
                        .orElseGet(PlayerGameweekStatsEntity::new);
                stats.setPlayer(entity);
                stats.setGameweek(currentGw);
                statsUpdater.update(stats, rawStats);
                statsRepo.save(stats);

                PlayerPointsEntity existingPoints = pointsRepo.findByPlayer_IdAndGameweek(entity.getId(), currentGw)
                        .orElseGet(() -> {
                            PlayerPointsEntity pp = new PlayerPointsEntity();
                            pp.setPlayer(entity);
                            pp.setGameweek(currentGw);
                            return pp;
                        });
                existingPoints.setPoints(stats.getTotalPoints());
                pointsRepo.save(existingPoints);

                int total = pointsRepo.findByPlayer_Id(entity.getId()).stream().mapToInt(PlayerPointsEntity::getPoints).sum();
                entity.setTotalPoints(total);
                playerRepo.save(entity);

            }
        } catch (Exception e) {
            log.error("Failed updating gameweek points: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed updating gameweek points", e);
        }
    }

    @Transactional
    public void refreshBasicPlayerData() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(FPL_API_URL, String.class);
            JsonNode root = mapper.readTree(response.getBody());
            JsonNode elements = root.get("elements");

            if (elements == null || !elements.isArray()) return;

            for (JsonNode node : elements) {
                int fplId = node.get("id").asInt();
                if (!node.get("can_select").asBoolean()) continue;

                PlayerEntity entity = playerRepo.findById(fplId).orElseGet(() -> {
                    PlayerEntity e = new PlayerEntity();
                    e.setId(fplId);
                    e.setTotalPoints(0);
                    e.setPhoto(node.get("code").asText());
                    return e;
                });

                updateEntityBasicData(entity, node);
                playerRepo.save(entity);

            }
        } catch (HttpServerErrorException.ServiceUnavailable e) {
            throw new IllegalStateException("FPL player data is temporarily unavailable (503)", e);
        } catch (Exception e) {
            log.error("Failed refreshing basic player data: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed refreshing basic player data", e);
        }
    }


    @Transactional
    public void fullSyncCurrentGw() {
        var currentGameweek = gameWeekService.getCurrentGameweek();
        if (currentGameweek == null) {
            throw new IllegalStateException("No current gameweek is available");
        }
        int gwId = currentGameweek.getId();
        fullSyncForGw(gwId);
    }

    @Transactional
    public void fullSyncForGw(int gwId) {
        refreshBasicPlayerData();
        updateGameweekPoints(gwId);
        log.info("Completed player and points sync for GW {}", gwId);
    }


    private PlayerEntity mapJsonToEntity(JsonNode node) {
        PlayerEntity entity = new PlayerEntity();
        entity.setId(node.get("id").asInt());
        updateEntityBasicData(entity, node);
        entity.setTotalPoints(0);
        return entity;
    }

    private void updateEntityBasicData(PlayerEntity entity, JsonNode node) {
        entity.setFirstName(node.get("first_name").asText());
        entity.setLastName(node.get("second_name").asText());
        entity.setViewName(node.get("web_name").asText());
        entity.setPosition(PlayerPosition.fromId(node.get("element_type").asInt()));
        entity.setTeamId(node.get("team").asInt());
        entity.setInjured(!node.get("status").asText().equals("a"));
        entity.setNews(node.hasNonNull("news") ? node.get("news").asText() : null);

        String code = node.get("code").asText();
        entity.setPhoto(code);

        if (node.has("chance_of_playing_this_round") && !node.get("chance_of_playing_this_round").isNull()) {
            entity.setChanceOfPlayingThisRound(node.get("chance_of_playing_this_round").asInt());
        }
        if (node.has("chance_of_playing_next_round") && !node.get("chance_of_playing_next_round").isNull()) {
            entity.setChanceOfPlayingNextRound(node.get("chance_of_playing_next_round").asInt());
        }
    }

    private RawGameStats mapJsonToRawStats(JsonNode node) {
        return new RawGameStats(
                node.get("minutes").asInt(),
                node.get("goals_scored").asInt(),
                node.get("assists").asInt(),
                node.get("goals_conceded").asInt(),
                node.get("yellow_cards").asInt(),
                node.get("red_cards").asInt(),
                node.get("penalties_saved").asInt(),
                node.get("penalties_missed").asInt(),
                node.get("own_goals").asInt(),
                node.get("starts").asInt() == 1,
                node.get("opponent_team").asInt(),
                node.get("was_home").asBoolean()
        );
    }


}
