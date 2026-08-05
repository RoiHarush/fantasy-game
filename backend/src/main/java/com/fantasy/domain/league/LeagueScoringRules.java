package com.fantasy.domain.league;

import java.util.LinkedHashMap;
import java.util.Map;

public final class LeagueScoringRules {

    private LeagueScoringRules() {}

    public static Map<String, Integer> defaults() {
        Map<String, Integer> rules = new LinkedHashMap<>();
        rules.put("GOAL.GOALKEEPER", 10);
        rules.put("GOAL.DEFENDER", 6);
        rules.put("GOAL.MIDFIELDER", 5);
        rules.put("GOAL.FORWARD", 4);
        rules.put("ASSIST.ALL", 3);
        rules.put("YELLOW_CARD.ALL", -1);
        rules.put("RED_CARD.ALL", -5);
        rules.put("PLAYED.ALL", 2);
        rules.put("FROM_BENCH.ALL", 1);
        rules.put("OWN_GOAL.ALL", -2);
        rules.put("PENALTY_SAVE.GOALKEEPER", 5);
        rules.put("PENALTY_MISS.GOALKEEPER", -10);
        rules.put("PENALTY_MISS.DEFENDER", -6);
        rules.put("PENALTY_MISS.MIDFIELDER", -5);
        rules.put("PENALTY_MISS.FORWARD", -4);
        rules.put("PENALTY_CONCEDED.ALL", -2);
        rules.put("SECOND_GOAL_BONUS.FORWARD", 1);
        rules.put("CLEAN_SHEET_30.GOALKEEPER", 2);
        rules.put("CLEAN_SHEET_46.GOALKEEPER", 3);
        rules.put("CLEAN_SHEET_60.GOALKEEPER", 5);
        rules.put("CLEAN_SHEET_30.DEFENDER", 1);
        rules.put("CLEAN_SHEET_46.DEFENDER", 2);
        rules.put("CLEAN_SHEET_60.DEFENDER", 4);
        rules.put("CLEAN_SHEET_30.MIDFIELDER", 0);
        rules.put("CLEAN_SHEET_46.MIDFIELDER", 0);
        rules.put("CLEAN_SHEET_60.MIDFIELDER", 1);
        rules.put("CLEAN_SHEET_30.FORWARD", 0);
        rules.put("CLEAN_SHEET_46.FORWARD", 0);
        rules.put("CLEAN_SHEET_60.FORWARD", 0);
        rules.put("GOAL_CONCEDED_AFTER_2.GOALKEEPER", -1);
        rules.put("GOAL_CONCEDED_AFTER_2.DEFENDER", -1);
        return rules;
    }
}
