package com.fantasy.dto;

public record RawGameStats(
        int minutes,
        int goals,
        int assists,
        int goalsConceded,
        int yellowCards,
        int redCards,
        int penaltiesSaved,
        int penaltiesMissed,
        int ownGoals,
        boolean started,
        int opponentTeamId,
        boolean wasHome
) {

    public static RawGameStats empty() {
        return new RawGameStats(0, 0, 0, 0, 0, 0, 0, 0, 0, false, 0, false);
    }
}
