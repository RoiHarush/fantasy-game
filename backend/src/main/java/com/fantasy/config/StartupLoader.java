package com.fantasy.config;

import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.player.*;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.realWorldData.TeamService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Component
public class StartupLoader {

    private static final Logger log = LoggerFactory.getLogger(StartupLoader.class);

    private final TeamService teamService;
    private final PlayerService playerService;
    private final PlayerSyncService playerSyncService;
    private final GameWeekService gameWeekService;
    private final FixtureService fixtureService;

    private final PlayerRepository playerRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    @Autowired
    public StartupLoader(TeamService teamService,
                         PlayerService playerService,
                         PlayerSyncService playerSyncService,
                         GameWeekService gameWeekService,
                         FixtureService fixtureService,
                         PlayerRepository playerRepository,
                         RestTemplate restTemplate,
                         ObjectMapper mapper) {
        this.teamService = teamService;
        this.playerService = playerService;
        this.playerSyncService = playerSyncService;
        this.gameWeekService = gameWeekService;
        this.fixtureService = fixtureService;
        this.playerRepository = playerRepository;
        this.restTemplate = restTemplate;
        this.mapper = mapper;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void run() {
        log.info("=== STARTUP SEQUENCE BEGIN ===");

        loadStaticData();

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
            playerSyncService.loadPlayersFromApi();
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

    private void updatePlayersPhotosFromApi() {
        log.info("Updating player photos using FPL code field...");

        try {
            String url = "https://fantasy.premierleague.com/api/bootstrap-static/";
            String response = restTemplate.getForObject(url, String.class);
            var root = mapper.readTree(response);
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
                persistPlayerPhotoUpdates(apiCodes);
            }

            log.info("Updated photo codes for {} players.", apiCodes.size());

        } catch (Exception e) {
            log.error("Failed to update player photos: {}", e.getMessage(), e);
        }
    }

    private void persistPlayerPhotoUpdates(Map<Integer, String> apiCodes) {
        var players = playerRepository.findAll();
        players.forEach(player -> {
            String photoCode = apiCodes.get(player.getId());
            if (photoCode != null && !photoCode.isBlank()) {
                player.setPhoto(photoCode);
            }
        });
        playerRepository.saveAll(players);
    }
}
