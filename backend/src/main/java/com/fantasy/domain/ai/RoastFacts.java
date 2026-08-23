package com.fantasy.domain.ai;

record RoastFacts(
        int userGameDataId,
        String manager,
        String fantasyTeam,
        int gameweek,
        int points,
        int rank,
        int leagueSize,
        double leagueAverage,
        int gapFromLeader,
        Integer previousGameweekPoints,
        Integer rankChange,
        String captain,
        int captainPoints,
        int captainMultiplier,
        String bestPlayer,
        int bestPlayerPoints,
        String worstStarter,
        int worstStarterPoints,
        int benchPoints,
        String bestBenchPlayer,
        int bestBenchPoints,
        boolean tripleCaptain,
        boolean benchBoost,
        String crownPlayer,
        Integer crownPoints,
        int starterGoals,
        int starterAssists,
        int starterRedCards
) {
}

