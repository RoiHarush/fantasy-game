package com.fantasy.config;

import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.user.*;
import com.fantasy.application.*;
import com.fantasy.infrastructure.mappers.PlayerMapper;
import com.fantasy.infrastructure.repositories.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.*;

@Component
public class StartupLoader {

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
        System.out.println("=== STARTUP SEQUENCE BEGIN ===");

        loadStaticData();

        loadRegistries();

        seedingService.seedAndInitializeDB();

        System.out.println("=== STARTUP COMPLETE ===");
    }

    private void loadStaticData() {
        System.out.println("Loading static data...");

        long teamsCount = teamService.countTeams();
        long playersCount = playerService.countPlayers();
        long fixturesCount = fixtureService.countFixtures();
        long gameweeksCount = gameWeekService.countGameweeks();

        if (teamsCount == 0) {
            System.out.println("→ Loading teams from API...");
            List<TeamEntity> teamsToSave = teamService.fetchTeamsFromApi();
            teamService.saveTeams(teamsToSave);
        } else {
            System.out.println("✔ Teams already exist (" + teamsCount + ")");
        }

        if (playersCount == 0) {
            System.out.println("→ Loading players from API...");
            playerService.loadPlayersFromApi();
            updatePlayersPhotosFromApi();
        } else {
            System.out.println("✔ Players already exist (" + playersCount + ")");
        }

        if (fixturesCount == 0) {
            System.out.println("→ Loading fixtures from API...");
            fixtureService.loadFromApiAndSave();
        } else {
            System.out.println("✔ Fixtures already exist (" + fixturesCount + ")");
        }

        if (gameweeksCount == 0) {
            System.out.println("→ Loading gameweeks from API...");
            gameWeekService.loadFromApiAndSave();
        } else {
            System.out.println("✔ Gameweeks already exist (" + gameweeksCount + ")");
        }
    }

    public void loadRegistries() {
        System.out.println("Loading registries to memory...");

        var players = playerRepo.findAll().stream()
                .map(p -> PlayerMapper.toDomain(p, pointsRepo.findByPlayer_Id(p.getId())))
                .toList();

        playerRegistry.addMany(players);
        System.out.println("✔ Finish loading Players to Registry");
    }

    private void updatePlayersPhotosFromApi() {
        System.out.println("🖼️ Updating player photos using FPL code field...");

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

            System.out.println("✔ Updated photo codes for " + apiCodes.size() + " players.");

        } catch (Exception e) {
            System.err.println("❌ Failed to update player photos: " + e.getMessage());
        }
    }
}