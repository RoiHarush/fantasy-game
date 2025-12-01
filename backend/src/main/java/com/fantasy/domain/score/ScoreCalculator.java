package com.fantasy.domain.score;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.score.Exception.ScoreException;
import com.fantasy.domain.score.Exception.UnknownScoreRuleException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
//TODO: Add exceptions
public class ScoreCalculator {
    private static final Map<ScoreType, Map<PlayerPosition, Integer>> RULES;

    static {
        Map<ScoreType, Map<PlayerPosition, Integer>> rules = new HashMap<>();
        // Goals
        rules.put(ScoreType.GOAL, Map.of(
                PlayerPosition.GOALKEEPER, 10,
                PlayerPosition.DEFENDER, 6,
                PlayerPosition.MIDFIELDER, 5,
                PlayerPosition.FORWARD, 4));
        // Assist
        rules.put(ScoreType.ASSIST, Map.of(
                PlayerPosition.GOALKEEPER, 3,
                PlayerPosition.DEFENDER, 3,
                PlayerPosition.MIDFIELDER, 3,
                PlayerPosition.FORWARD, 3));
        // Yellow Card
        rules.put(ScoreType.YELLOW_CARD, Map.of(
                PlayerPosition.GOALKEEPER, -1,
                PlayerPosition.DEFENDER, -1,
                PlayerPosition.MIDFIELDER, -1,
                PlayerPosition.FORWARD, -1));
        // Red Card
        rules.put(ScoreType.RED_CARD, Map.of(
                PlayerPosition.GOALKEEPER, -5,
                PlayerPosition.DEFENDER, -5,
                PlayerPosition.MIDFIELDER, -5,
                PlayerPosition.FORWARD, -5));
        // Started
        rules.put(ScoreType.PLAYED, Map.of(
                PlayerPosition.GOALKEEPER, 2,
                PlayerPosition.DEFENDER, 2,
                PlayerPosition.MIDFIELDER, 2,
                PlayerPosition.FORWARD, 2));
        // From Bench
        rules.put(ScoreType.FROM_BENCH, Map.of(
                PlayerPosition.GOALKEEPER, 1,
                PlayerPosition.DEFENDER, 1,
                PlayerPosition.MIDFIELDER, 1,
                PlayerPosition.FORWARD, 1));
        // Own Goal
        rules.put(ScoreType.OWN_GOAL, Map.of(
                PlayerPosition.GOALKEEPER, -2,
                PlayerPosition.DEFENDER, -2,
                PlayerPosition.MIDFIELDER, -2,
                PlayerPosition.FORWARD, -2));
        // Penalty Save
        rules.put(ScoreType.PENALTY_SAVE, Map.of(
                PlayerPosition.GOALKEEPER, 5,
                PlayerPosition.DEFENDER, 0,
                PlayerPosition.MIDFIELDER, 0,
                PlayerPosition.FORWARD, 0));
        // Penalty Miss
        rules.put(ScoreType.PENALTY_MISS, Map.of(
                PlayerPosition.GOALKEEPER, -10,
                PlayerPosition.DEFENDER, -6,
                PlayerPosition.MIDFIELDER, -5,
                PlayerPosition.FORWARD, -4));

        RULES = rules;
    }

    public static int calculatePoints(ScoreEvent event) {
        if (event == null || event.getPlayer() == null || event.getType() == null) {
            throw new ScoreException("ScoreEvent or its properties are null");
        }

        Player player = event.getPlayer();
        ScoreType scoreType = event.getType();
        PlayerPosition position = player.getPosition();

        int points;

        switch (scoreType) {
            case GOAL:
                points = RULES.get(ScoreType.GOAL).get(position);
                if (position == PlayerPosition.FORWARD && event.getGoalIndex() >= 2) {
                    points += 1;
                }
                break;

            case CLEAN_SHEET: {
                int minutes = event.getMinutesPlayed();

                if (PlayerPosition.GOALKEEPER.equals(position)) {
                    if (minutes >= 60) points = 5;
                    else if (minutes >= 46) points = 3;
                    else if (minutes >= 30) points = 2;
                    else points = 0;
                }
                else if (PlayerPosition.DEFENDER.equals(position)) {
                    if (minutes >= 60) points = 4;
                    else if (minutes >= 46) points = 2;
                    else if (minutes >= 30) points = 1;
                    else points = 0;
                } else if (PlayerPosition.MIDFIELDER.equals(position) && minutes >= 60) {
                    points = 1;
                } else {
                    points = 0;
                }
                break;
            }


            case GOAL_CONCEDED:
                int conceded = event.getGoalsConceded();
                if (position == PlayerPosition.GOALKEEPER || position == PlayerPosition.DEFENDER) {
                    if (conceded >= 3) {
                        points = -(conceded - 2);
                    } else {
                        points = 0;
                    }
                } else {
                    points = 0;
                }
                break;

            case PENALTY_WON:
                if (!event.isTakenBySamePlayer() && event.isPenaltyScored()) {
                    points = 3;
                } else {
                    points = 0;
                }
                break;

            case PENALTY_CONCEDED:
                points = -2;
                break;

            default:
                if (!RULES.containsKey(scoreType) || !RULES.get(scoreType).containsKey(position)) {
                    throw new UnknownScoreRuleException("Unknown scoring rule for event type: " + scoreType + " and position: " + position);
                }
                points = RULES.get(scoreType).get(position);
        }

        return points;
    }

    public static int calculatePointsForPlayer(List<ScoreEvent> events) {
        return events.stream()
                .mapToInt(ScoreCalculator::calculatePoints)
                .sum();
    }
}
