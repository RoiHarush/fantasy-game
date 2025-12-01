package com.fantasy.domain.player;

import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.score.*;
import com.fantasy.domain.team.UserSquadEntity;
import com.fantasy.domain.team.UserSquadRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.CompletableFuture;
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
    private final PlayerRegistry playerRegistry;
    private final UserSquadRepository squadRepo;
    private final ScoringLogicService scoringLogic;
    private final GameWeekService gameWeekService;

    private final ApplicationEventPublisher eventPublisher;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public PlayerSyncService(PlayerRepository playerRepo,
                             PlayerPointsRepository pointsRepo,
                             PlayerGameweekStatsRepository statsRepo,
                             PlayerRegistry playerRegistry,
                             UserSquadRepository squadRepo,
                             ScoringLogicService scoringLogic,
                             GameWeekService gameWeekService,
                             ApplicationEventPublisher eventPublisher) {
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.statsRepo = statsRepo;
        this.playerRegistry = playerRegistry;
        this.squadRepo = squadRepo;
        this.scoringLogic = scoringLogic;
        this.gameWeekService = gameWeekService;
        this.eventPublisher = eventPublisher;
    }


    private record PlayerLoadResult(
            List<PlayerEntity> playersToSave,
            List<PlayerGameweekStatsEntity> allStatsToSave,
            List<PlayerPointsEntity> allPointsToSave
    ) {}

    public void loadPlayersFromApi() {
        long startTime = System.currentTimeMillis();
        log.info("Starting optimized player load (Parallel Mode)...");

        try {
            PlayerLoadResult result = fetchPlayersAndHistoryData();
            persistPlayerData(result);
            long duration = System.currentTimeMillis() - startTime;
            log.info("Finished loading players in {} seconds.", (duration / 1000));
        } catch (Exception e) {
            log.error("Failed to load players: {}", e.getMessage());
            throw new RuntimeException("Failed to load players", e);
        }
    }

    private PlayerLoadResult fetchPlayersAndHistoryData() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity(FPL_API_URL, String.class);
        JsonNode root = mapper.readTree(response.getBody());
        JsonNode elements = root.get("elements");

        List<PlayerEntity> playersToProcess = new ArrayList<>();

        for (JsonNode node : elements) {
            if (!node.get("can_select").asBoolean()) continue;
            playersToProcess.add(mapJsonToEntity(node));
        }

        List<PlayerGameweekStatsEntity> allStatsToSave = Collections.synchronizedList(new ArrayList<>());
        List<PlayerPointsEntity> allPointsToSave = Collections.synchronizedList(new ArrayList<>());

        ExecutorService executor = Executors.newFixedThreadPool(20);
        List<CompletableFuture<Void>> futures = new ArrayList<>();
        AtomicInteger counter = new AtomicInteger(0);

        log.info("Fetching history for all players in parallel...");

        for (PlayerEntity player : playersToProcess) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                try {
                    processPlayerHistory(player, allStatsToSave, allPointsToSave);
                    counter.incrementAndGet();
                } catch (Exception e) {
                    log.error("Error processing player {}: {}", player.getId(), e.getMessage());
                }
            }, executor);
            futures.add(future);
        }

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        executor.shutdown();

        Map<Integer, Integer> playerTotalPoints = new HashMap<>();
        for (PlayerPointsEntity pp : allPointsToSave) {
            playerTotalPoints.merge(pp.getPlayer().getId(), pp.getPoints(), Integer::sum);
        }
        for (PlayerEntity p : playersToProcess) {
            p.setTotalPoints(playerTotalPoints.getOrDefault(p.getId(), 0));
        }

        return new PlayerLoadResult(playersToProcess, allStatsToSave, allPointsToSave);
    }

    @Transactional
    public void persistPlayerData(PlayerLoadResult result) {
        log.info("Saving initial players to DB...");
        playerRepo.saveAll(result.playersToSave());
        statsRepo.saveAll(result.allStatsToSave());
        pointsRepo.saveAll(result.allPointsToSave());
        playerRepo.saveAll(result.playersToSave());
    }

    private void processPlayerHistory(PlayerEntity player, List<PlayerGameweekStatsEntity> statsList, List<PlayerPointsEntity> pointsList) {
        try {
            String historyUrl = FPL_PLAYER_URL + player.getId() + "/";
            ResponseEntity<String> historyRes = restTemplate.getForEntity(historyUrl, String.class);
            JsonNode historyRoot = mapper.readTree(historyRes.getBody());
            JsonNode history = historyRoot.get("history");

            if (history == null || history.isEmpty()) return;

            Player domainPlayer = new Player(player.getId(), player.getFirstName(), player.getLastName(), player.getPosition(), player.getTeamId(), player.getViewName());

            for (JsonNode gw : history) {
                RawGameStats rawStats = mapJsonToRawStats(gw);

                PlayerGameweekStatsEntity stats = new PlayerGameweekStatsEntity();
                stats.setPlayer(player);
                stats.setGameweek(gw.get("round").asInt());
                scoringLogic.updateStatsEntity(stats, domainPlayer, rawStats);
                statsList.add(stats);

                PlayerPointsEntity pp = new PlayerPointsEntity();
                pp.setPlayer(player);
                pp.setGameweek(stats.getGameweek());
                pp.setPoints(stats.getTotalPoints());
                pointsList.add(pp);
            }
        } catch (Exception e) {
            log.error("Failed to parse history for player {}: {}", player.getId(), e.getMessage());
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

                Player domainPlayer = playerRegistry.findById(entity.getId());
                if (domainPlayer == null) continue;

                RawGameStats rawStats = mapJsonToRawStats(latest);

                PlayerGameweekStatsEntity stats = statsRepo.findByPlayer_IdAndGameweek(entity.getId(), currentGw)
                        .orElseGet(PlayerGameweekStatsEntity::new);
                stats.setPlayer(entity);
                stats.setGameweek(currentGw);
                scoringLogic.updateStatsEntity(stats, domainPlayer, rawStats);
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

                domainPlayer.getPointsByGameweek().put(currentGw, stats.getTotalPoints());

            }
        } catch (Exception e) {
            log.error("Failed updating gameweek points: {}", e.getMessage(), e);
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

                PlayerEntity entity = playerRepo.findById(fplId).orElse(new PlayerEntity());
                updateEntityBasicData(entity, node);
                playerRepo.save(entity);

                Player domainPlayer = playerRegistry.findById(entity.getId());
                if (domainPlayer == null) {
                    playerRegistry.add(new Player(entity.getId(), entity.getFirstName(), entity.getLastName(), entity.getPosition(), entity.getTeamId(), entity.getViewName()));
                } else {
                    domainPlayer.setTeamId(entity.getTeamId());
                    domainPlayer.setInjured(entity.isInjured());
                }
            }
        } catch (Exception e) {
            log.error("Failed refreshing basic player data: {}", e.getMessage(), e);
        }
    }


    @Transactional
    public void fullSyncCurrentGw() {
        int gwId = gameWeekService.getNextGameweek().getId();
        fullSyncForGw(gwId);
    }

    @Transactional
    public void fullSyncForGw(int gwId) {
        List<UserSquadEntity> gwSquads = squadRepo.findByGameweek(gwId);
        List<PlayerEntity> allPlayers = playerRepo.findAll();

        allPlayers.forEach(p -> { p.setOwnerId(-1); p.setState(PlayerState.NONE); });

        for (UserSquadEntity squad : gwSquads) {
            int userId = squad.getUser().getId();
            setOwnership(squad.getStartingLineup(), userId, PlayerState.STARTING);
            setOwnership(squad.getBenchMap().values(), userId, PlayerState.BENCH);
        }
        playerRepo.saveAll(allPlayers);

        playerRegistry.getPlayers().forEach(p -> { p.setOwnerId(-1); p.setState(PlayerState.NONE); });
        for (UserSquadEntity squad : gwSquads) {
            int userId = squad.getUser().getId();
            updateRegistryOwnership(squad.getStartingLineup(), userId, PlayerState.STARTING);
            updateRegistryOwnership(squad.getBenchMap().values(), userId, PlayerState.BENCH);
        }
        log.info("Ownership sync completed for GW {}", gwId);
    }

    private void setOwnership(Collection<Integer> ids, int ownerId, PlayerState state) {
        if(ids == null) return;
        for (Integer pid : ids) {
            playerRepo.findById(pid).ifPresent(p -> {
                p.setOwnerId(ownerId);
                p.setState(state);
            });
        }
    }

    private void updateRegistryOwnership(Collection<Integer> ids, int ownerId, PlayerState state) {
        if(ids == null) return;
        for (Integer pid : ids) {
            Player p = playerRegistry.findById(pid);
            if (p != null) {
                p.setOwnerId(ownerId);
                p.setState(state);
            }
        }
    }


    @Transactional
    public PlayerAssistedDto updatePlayerAssist(UpdateAssistRequest request) {
        PlayerGameweekStatsEntity statsEntity = statsRepo.findByPlayer_IdAndGameweek(request.getPlayerId(), request.getGameweek())
                .orElseThrow(() -> new RuntimeException("Stats not found"));

        Player domainPlayer = PlayerMapper.toDomain(statsEntity.getPlayer(), null);
        ScoreEvent assistEvent = new ScoreEvent(domainPlayer, 0, ScoreType.ASSIST);
        int pointDelta = ScoreCalculator.calculatePoints(assistEvent);
        boolean isAdd = "ADD".equalsIgnoreCase(request.getAction());

        if (isAdd) {
            statsEntity.setAssists(statsEntity.getAssists() + 1);
            statsEntity.setTotalPoints(statsEntity.getTotalPoints() + pointDelta);
        } else {
            statsEntity.setAssists(statsEntity.getAssists() - 1);
            statsEntity.setTotalPoints(statsEntity.getTotalPoints() - pointDelta);
        }
        statsRepo.save(statsEntity);

        pointsRepo.findByPlayer_IdAndGameweek(request.getPlayerId(), request.getGameweek())
                .ifPresent(pp -> {
                    pp.setPoints(statsEntity.getTotalPoints());
                    pointsRepo.save(pp);
                });

        Player registryPlayer = playerRegistry.findById(statsEntity.getPlayer().getId());
        if (registryPlayer != null) registryPlayer.getPointsByGameweek().put(request.getGameweek(), statsEntity.getTotalPoints());

        eventPublisher.publishEvent(new PlayerPointsUpdateEvent(this, request.getPlayerId(), request.getGameweek()));

        return new PlayerAssistedDto(statsEntity.getPlayer().getId(), statsEntity.getPlayer().getViewName(), statsEntity.getAssists(), statsEntity.getPlayer().getTeamId());
    }

    @Transactional
    public PlayerPenaltyDto updatePlayerPenalty(UpdatePenaltyRequest request) {
        PlayerGameweekStatsEntity statsEntity = statsRepo.findByPlayer_IdAndGameweek(request.getPlayerId(), request.getGameweek())
                .orElseThrow(() -> new RuntimeException("Stats not found"));

        Player domainPlayer = PlayerMapper.toDomain(statsEntity.getPlayer(), null);
        ScoreEvent penaltyEvent = new ScoreEvent(domainPlayer, 0, ScoreType.PENALTY_CONCEDED);
        int pointDelta = ScoreCalculator.calculatePoints(penaltyEvent);
        boolean isAdd = "ADD".equalsIgnoreCase(request.getAction());

        if (isAdd) {
            statsEntity.setPenaltiesConceded(statsEntity.getPenaltiesConceded() + 1);
            statsEntity.setTotalPoints(statsEntity.getTotalPoints() + pointDelta);
        } else {
            statsEntity.setPenaltiesConceded(statsEntity.getPenaltiesConceded() - 1);
            statsEntity.setTotalPoints(statsEntity.getTotalPoints() - pointDelta);
        }
        statsRepo.save(statsEntity);

        pointsRepo.findByPlayer_IdAndGameweek(request.getPlayerId(), request.getGameweek())
                .ifPresent(pp -> {
                    pp.setPoints(statsEntity.getTotalPoints());
                    pointsRepo.save(pp);
                });

        Player registryPlayer = playerRegistry.findById(statsEntity.getPlayer().getId());
        if (registryPlayer != null) registryPlayer.getPointsByGameweek().put(request.getGameweek(), statsEntity.getTotalPoints());

        eventPublisher.publishEvent(new PlayerPointsUpdateEvent(this, request.getPlayerId(), request.getGameweek()));

        return new PlayerPenaltyDto(statsEntity.getPlayer().getId(), statsEntity.getPlayer().getViewName(), statsEntity.getPenaltiesConceded(), statsEntity.getPlayer().getTeamId());
    }

    @Transactional
    public PlayerDto togglePlayerLock(int playerId, boolean shouldLock) {
        PlayerEntity player = playerRepo.findById(playerId).orElseThrow(() -> new RuntimeException("Player not found"));
        Player p = playerRegistry.findById(playerId);

        if (shouldLock && player.getState() != PlayerState.NONE) throw new RuntimeException("Can only lock NONE state players");
        if (!shouldLock && player.getState() != PlayerState.LOCKED) throw new RuntimeException("Can only unlock LOCKED state players");

        PlayerState newState = shouldLock ? PlayerState.LOCKED : PlayerState.NONE;
        player.setState(newState);
        if (p != null) p.setState(newState);

        playerRepo.save(player);
        return PlayerMapper.toDto(player, null, null);
    }


    private PlayerEntity mapJsonToEntity(JsonNode node) {
        PlayerEntity entity = new PlayerEntity();
        entity.setId(node.get("id").asInt());
        updateEntityBasicData(entity, node);
        entity.setOwnerId(-1);
        entity.setState(PlayerState.NONE);
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