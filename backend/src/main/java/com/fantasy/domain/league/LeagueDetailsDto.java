package com.fantasy.domain.league;

import java.util.Map;

public record LeagueDetailsDto(
        Long id,
        String name,
        String leagueCode,
        int maxParticipants,
        int participantCount,
        int adminId,
        boolean currentUserAdmin,
        Map<String, Integer> scoringRules,
        LeagueStatus status
) {}
