package com.fantasy.domain.league;

import java.util.Map;

public record UpdateLeagueSettingsRequest(
        String name,
        Integer maxParticipants,
        Map<String, Integer> scoringRules
) {}
