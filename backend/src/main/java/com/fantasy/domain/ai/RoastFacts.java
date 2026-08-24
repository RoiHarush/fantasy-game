package com.fantasy.domain.ai;

import java.util.List;

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
        PlayerMatchState captainMatchState,
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
        int starterRedCards,
        boolean finalScore,
        List<PlayerRoastSnapshot> starters,
        List<PlayerRoastSnapshot> bench
) {
}

record PlayerRoastSnapshot(String name, int points, PlayerMatchState matchState) {
}

enum PlayerMatchState {
    NOT_STARTED,
    LIVE,
    FINISHED,
    PARTIALLY_COMPLETE,
    UNKNOWN;

    boolean isSafeToJudge() {
        return this == FINISHED;
    }

    boolean hasStarted() {
        return this == LIVE || this == FINISHED || this == PARTIALLY_COMPLETE;
    }

    String promptLabel() {
        return switch (this) {
            case NOT_STARTED -> "טרם שיחק; אסור לשפוט את האפס או את הניקוד הנמוך";
            case LIVE -> "משחק כעת; הניקוד עדיין יכול להשתנות ואסור לשפוט אותו כסופי";
            case FINISHED -> "כל משחקיו במחזור הסתיימו; מותר לשפוט את הניקוד";
            case PARTIALLY_COMPLETE -> "סיים משחק אחד אבל נשאר לו משחק נוסף במחזור; הניקוד עדיין לא סופי";
            case UNKNOWN -> "מצב המשחק לא ידוע; אסור לצחוק על אפס או להסיק שנכשל";
        };
    }
}

