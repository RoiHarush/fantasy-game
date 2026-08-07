package com.fantasy.application;

import com.fantasy.domain.game.FixtureService;
import com.fantasy.domain.game.GameWeekService;
import com.fantasy.domain.player.PlayerService;
import com.fantasy.domain.player.PlayerSyncService;
import com.fantasy.domain.realWorldData.TeamService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReferenceDataBootstrapServiceTest {

    @Test
    void normalRestartDoesNotCallFplWhenReferenceDataAlreadyExists() {
        TeamService teamService = mock(TeamService.class);
        PlayerService playerService = mock(PlayerService.class);
        PlayerSyncService playerSyncService = mock(PlayerSyncService.class);
        FixtureService fixtureService = mock(FixtureService.class);
        GameWeekService gameWeekService = mock(GameWeekService.class);
        RestTemplate restTemplate = mock(RestTemplate.class);

        when(teamService.countTeams()).thenReturn(20L);
        when(playerService.countPlayers()).thenReturn(565L);
        when(fixtureService.countFixtures()).thenReturn(380L);
        when(gameWeekService.countGameweeks()).thenReturn(38L);

        var service = new ReferenceDataBootstrapService(
                teamService,
                playerService,
                playerSyncService,
                fixtureService,
                gameWeekService,
                restTemplate,
                new ObjectMapper()
        );

        var summary = service.bootstrapMissingData();

        assertEquals(565, summary.players());
        verify(restTemplate, never()).getForObject(anyString(), eq(String.class));
        verify(playerSyncService, never()).loadPlayersFromBootstrap(any());
        verify(fixtureService, never()).loadFromApiAndSave();
    }

    @Test
    void freshSeasonUsesOneSharedBootstrapDocument() throws Exception {
        TeamService teamService = mock(TeamService.class);
        PlayerService playerService = mock(PlayerService.class);
        PlayerSyncService playerSyncService = mock(PlayerSyncService.class);
        FixtureService fixtureService = mock(FixtureService.class);
        GameWeekService gameWeekService = mock(GameWeekService.class);
        RestTemplate restTemplate = mock(RestTemplate.class);
        ObjectMapper objectMapper = new ObjectMapper();

        when(teamService.countTeams()).thenReturn(0L, 20L);
        when(playerService.countPlayers()).thenReturn(0L, 565L);
        when(fixtureService.countFixtures()).thenReturn(0L, 380L);
        when(gameWeekService.countGameweeks()).thenReturn(0L, 38L);
        when(restTemplate.getForObject(anyString(), eq(String.class)))
                .thenReturn("{\"teams\":[],\"elements\":[],\"events\":[]}");
        when(teamService.parseTeams(any(JsonNode.class))).thenReturn(List.of());

        var service = new ReferenceDataBootstrapService(
                teamService,
                playerService,
                playerSyncService,
                fixtureService,
                gameWeekService,
                restTemplate,
                objectMapper
        );

        var summary = service.bootstrapMissingData();

        assertEquals(20, summary.teams());
        assertEquals(565, summary.players());
        assertEquals(380, summary.fixtures());
        assertEquals(38, summary.gameweeks());
        verify(restTemplate).getForObject(anyString(), eq(String.class));
        verify(teamService).parseTeams(any(JsonNode.class));
        verify(playerSyncService).loadPlayersFromBootstrap(any(JsonNode.class));
        verify(fixtureService).loadFromApiAndSave();
        verify(gameWeekService).saveGameWeeks(any(JsonNode.class));
    }
}
