package com.fantasy.domain.league;

import java.util.Map;

public record CreateLeagueRequest(
        String name,
        Integer maxParticipants,
        String fantasyTeamName,
        Map<String, Integer> scoringRules
) {}
