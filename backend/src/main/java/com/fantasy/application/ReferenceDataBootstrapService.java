package com.fantasy.application;

import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.player.PlayerService;
import com.fantasy.domain.player.PlayerSyncService;
import com.fantasy.domain.realWorldData.TeamService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ReferenceDataBootstrapService {

    private static final String BOOTSTRAP_URL =
            "https://fantasy.premierleague.com/api/bootstrap-static/";

    private final TeamService teamService;
    private final PlayerService playerService;
    private final PlayerSyncService playerSyncService;
    private final FixtureService fixtureService;
    private final GameWeekService gameWeekService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public ReferenceDataBootstrapService(TeamService teamService,
                                         PlayerService playerService,
                                         PlayerSyncService playerSyncService,
                                         FixtureService fixtureService,
                                         GameWeekService gameWeekService,
                                         RestTemplate restTemplate,
                                         ObjectMapper objectMapper) {
        this.teamService = teamService;
        this.playerService = playerService;
        this.playerSyncService = playerSyncService;
        this.fixtureService = fixtureService;
        this.gameWeekService = gameWeekService;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public BootstrapSummary bootstrapMissingData() {
        long teams = teamService.countTeams();
        long players = playerService.countPlayers();
        long fixtures = fixtureService.countFixtures();
        long gameweeks = gameWeekService.countGameweeks();
        boolean teamsNeedRefresh = teams == 0 || teamService.hasTeamsWithoutBadgeCode();

        JsonNode bootstrap = null;
        if (teamsNeedRefresh || players == 0 || gameweeks == 0) {
            bootstrap = fetchBootstrapDocument();
        }

        if (teamsNeedRefresh) {
            teamService.saveTeams(teamService.parseTeams(bootstrap));
        }
        if (players == 0) {
            playerSyncService.loadPlayersFromBootstrap(bootstrap);
        }
        if (fixtures == 0) {
            fixtureService.loadFromApiAndSave();
        }
        if (gameweeks == 0) {
            gameWeekService.saveGameWeeks(bootstrap);
        }

        BootstrapSummary summary = currentSummary();
        if (!summary.isComplete()) {
            throw new IllegalStateException("FPL bootstrap finished with incomplete reference data: " + summary);
        }
        return summary;
    }

    public BootstrapSummary currentSummary() {
        return new BootstrapSummary(
                teamService.countTeams(),
                playerService.countPlayers(),
                fixtureService.countFixtures(),
                gameWeekService.countGameweeks()
        );
    }

    private JsonNode fetchBootstrapDocument() {
        try {
            String response = restTemplate.getForObject(BOOTSTRAP_URL, String.class);
            JsonNode root = objectMapper.readTree(response);
            if (root == null || !root.hasNonNull("teams") || !root.hasNonNull("elements")
                    || !root.hasNonNull("events")) {
                throw new IllegalStateException("FPL bootstrap response is missing required collections");
            }
            return root;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to fetch FPL bootstrap data", exception);
        }
    }

    public record BootstrapSummary(long teams, long players, long fixtures, long gameweeks) {
        public boolean isComplete() {
            return teams > 0 && players > 0 && fixtures > 0 && gameweeks > 0;
        }
    }
}
