package com.fantasy.Score;

import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerPosition;
import com.fantasy.Score.Exception.ScoreException;
import com.fantasy.Score.Exception.UnknownScoreRuleException;
import com.fantasy.ScoreEvent.ScoreEvent;
import com.fantasy.ScoreEvent.ScoreType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
//TODO: Add exceptions
public class ScoreCalculator {
    private static final Map<ScoreType, Map<PlayerPosition, Integer>> RULES;
    //TODO: Create logic for goal conceded, clean sheet, make a penalty.
    static{
        Map<ScoreType, Map<PlayerPosition, Integer>> rules = new HashMap<>();
        //Goals
        rules.put(ScoreType.GOAL, Map.of(
                PlayerPosition.GOALKEEPER, 10,
                PlayerPosition.DEFENDER, 6,
                PlayerPosition.MIDFIELDER,5,
                PlayerPosition.FORWARD,4));
        //Assist
        rules.put(ScoreType.ASSIST, Map.of(
                PlayerPosition.GOALKEEPER, 3,
                PlayerPosition.DEFENDER, 3,
                PlayerPosition.MIDFIELDER,3,
                PlayerPosition.FORWARD,3));
        //Yellow Card
        rules.put(ScoreType.YELLOW_CARD, Map.of(
                PlayerPosition.GOALKEEPER, -1,
                PlayerPosition.DEFENDER, -1,
                PlayerPosition.MIDFIELDER,-1,
                PlayerPosition.FORWARD,-1));
        //Red Card
        rules.put(ScoreType.RED_CARD, Map.of(
                PlayerPosition.GOALKEEPER, -5,
                PlayerPosition.DEFENDER, -5,
                PlayerPosition.MIDFIELDER,-5,
                PlayerPosition.FORWARD,-5));
        //Played
        rules.put(ScoreType.PLAYED, Map.of(
                PlayerPosition.GOALKEEPER, 2,
                PlayerPosition.DEFENDER, 2,
                PlayerPosition.MIDFIELDER,2,
                PlayerPosition.FORWARD,2));
        //From Bench
        rules.put(ScoreType.FROM_BENCH, Map.of(
                PlayerPosition.GOALKEEPER, 1,
                PlayerPosition.DEFENDER, 1,
                PlayerPosition.MIDFIELDER,1,
                PlayerPosition.FORWARD,1));
        //Played over 60 minutes
        rules.put(ScoreType.PLAYED_OVER_60, Map.of(
                PlayerPosition.GOALKEEPER, 6,
                PlayerPosition.DEFENDER, 6,
                PlayerPosition.MIDFIELDER,5,
                PlayerPosition.FORWARD,4));
        //bonus
        rules.put(ScoreType.BONUS, Map.of(
                PlayerPosition.GOALKEEPER, 6,
                PlayerPosition.DEFENDER, 6,
                PlayerPosition.MIDFIELDER,5,
                PlayerPosition.FORWARD,4));
        //Own Goal
        rules.put(ScoreType.OWN_GOAL, Map.of(
                PlayerPosition.GOALKEEPER, -2,
                PlayerPosition.DEFENDER, -2,
                PlayerPosition.MIDFIELDER,-2,
                PlayerPosition.FORWARD,-2));
        //Penalty Save
        rules.put(ScoreType.PENALTY_SAVE, Map.of(
                PlayerPosition.GOALKEEPER, 5,
                PlayerPosition.DEFENDER, 0,
                PlayerPosition.MIDFIELDER,0,
                PlayerPosition.FORWARD,0));
        //Penalty Miss
        rules.put(ScoreType.PENALTY_MISS, Map.of(
                PlayerPosition.GOALKEEPER, -10,
                PlayerPosition.DEFENDER, -6,
                PlayerPosition.MIDFIELDER,-5,
                PlayerPosition.FORWARD,-4));
         RULES = rules;
    }

    public static int calculatePoints(ScoreEvent event) {
        if (event == null || event.getPlayer() == null || event.getType() == null) {
            throw new ScoreException("ScoreEvent or its properties are null");
        }

        Player player = event.getPlayer();
        ScoreType scoreType = event.getType();
        PlayerPosition position = player.getPosition();

        if (scoreType == null || position == null || !RULES.containsKey(scoreType) || !RULES.get(scoreType).containsKey(position)) {
            throw new UnknownScoreRuleException("Unknown scoring rule for event type: " + scoreType + " and position: " + position);
        }

        int points = RULES.get(scoreType).get(position);
        if (player.isCaptain()) {
            points *= 2;
        }
        return points;
    }

    public static int calculatePointsForPlayer(Player player, List<ScoreEvent> events) {
        int total = 0;
        for (ScoreEvent event : events) {
            total += calculatePoints(event);
        }
        return total;
    }
}
