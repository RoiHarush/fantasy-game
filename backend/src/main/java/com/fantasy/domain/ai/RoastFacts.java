package com.fantasy.domain.ai;

record RoastFacts(
        String manager,
        String fantasyTeam,
        int gameweek,
        int points,
        int rank,
        int leagueSize,
        String captain,
        int captainPoints,
        String bestPlayer,
        int bestPlayerPoints,
        int benchPoints,
        String bestBenchPlayer,
        int bestBenchPoints,
        boolean tripleCaptain,
        boolean benchBoost
) {
}

