package com.fantasy.config;

import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.user.*;
import com.fantasy.application.*;
import com.fantasy.infrastructure.mappers.PlayerMapper;
import com.fantasy.infrastructure.repositories.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.*;

@Component
public class StartupLoader {

    private static final Logger log = LoggerFactory.getLogger(StartupLoader.class);

    private final TeamService teamService;
    private final PlayerService playerService;
    private final GameWeekService gameWeekService;
    private final FixtureService fixtureService;

    private final PlayerRepository playerRepo;
    private final PlayerPointsRepository pointsRepo;
    private final PlayerRegistry playerRegistry;

    private final SeedingService seedingService;

    @Autowired
    public StartupLoader(TeamService teamService,
                         PlayerService playerService,
                         GameWeekService gameWeekService,
                         FixtureService fixtureService,
                         PlayerRepository playerRepo,
                         PlayerPointsRepository pointsRepo,
                         PlayerRegistry playerRegistry,
                         SeedingService seedingService) {
        this.teamService = teamService;
        this.playerService = playerService;
        this.gameWeekService = gameWeekService;
        this.fixtureService = fixtureService;
        this.playerRepo = playerRepo;
        this.pointsRepo = pointsRepo;
        this.playerRegistry = playerRegistry;
        this.seedingService = seedingService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void run() {
        log.info("=== STARTUP SEQUENCE BEGIN ===");

        loadStaticData();
        loadRegistries();
        seedingService.seedAndInitializeDB();

        log.info("=== STARTUP COMPLETE ===");
    }

    private void loadStaticData() {
        log.info("Loading static data...");

        long teamsCount = teamService.countTeams();
        long playersCount = playerService.countPlayers();
        long fixturesCount = fixtureService.countFixtures();
        long gameweeksCount = gameWeekService.countGameweeks();

        if (teamsCount == 0) {
            log.info("Loading teams from API...");
            List<TeamEntity> teamsToSave = teamService.fetchTeamsFromApi();
            teamService.saveTeams(teamsToSave);
        } else {
            log.info("Teams already exist ({})", teamsCount);
        }

        if (playersCount == 0) {
            log.info("Loading players from API...");
            playerService.loadPlayersFromApi();
            updatePlayersPhotosFromApi();
        } else {
            log.info("Players already exist ({})", playersCount);
        }

        if (fixturesCount == 0) {
            log.info("Loading fixtures from API...");
            fixtureService.loadFromApiAndSave();
        } else {
            log.info("Fixtures already exist ({})", fixturesCount);
        }

        if (gameweeksCount == 0) {
            log.info("Loading gameweeks from API...");
            gameWeekService.loadFromApiAndSave();
        } else {
            log.info("Gameweeks already exist ({})", gameweeksCount);
        }
    }

    public void loadRegistries() {
        log.info("Loading registries to memory...");

        var players = playerRepo.findAll().stream()
                .map(p -> PlayerMapper.toDomain(p, pointsRepo.findByPlayer_Id(p.getId())))
                .toList();

        playerRegistry.addMany(players);
        log.info("Finished loading Players to Registry ({} players)", players.size());
    }

    private void updatePlayersPhotosFromApi() {
        log.info("Updating player photos using FPL code field...");

        try {
            String url = "https://fantasy.premierleague.com/api/bootstrap-static/";
            var mapper = new ObjectMapper();
            var root = mapper.readTree(new URL(url));
            var elements = root.get("elements");

            Map<Integer, String> apiCodes = new HashMap<>();
            for (JsonNode e : elements) {
                int id = e.get("id").asInt();
                String code = e.get("code").asText(null);
                if (code != null && !code.isBlank()) {
                    apiCodes.put(id, code);
                }
            }

            if (!apiCodes.isEmpty()) {
                seedingService.persistPlayerPhotoUpdates(apiCodes);
            }

            log.info("Updated photo codes for {} players.", apiCodes.size());

        } catch (Exception e) {
            log.error("Failed to update player photos: {}", e.getMessage(), e);
        }
    }
}
