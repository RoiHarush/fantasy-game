package com.fantasy.ScoreTest;

import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerPosition;
import com.fantasy.RealWorldData.Team;
import com.fantasy.RealWorldData.TeamName;
import com.fantasy.Score.Exception.UnknownScoreRuleException;
import com.fantasy.Score.ScoreCalculator;
import com.fantasy.ScoreEvent.ScoreEvent;
import com.fantasy.ScoreEvent.ScoreType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ScoreCalculatorTest {

    private Player midfielder;
    private Player defender;
    private Player captain;

    @BeforeEach
    void setUp() {
        Team liverpool = new Team(TeamName.Liverpool.name());
        midfielder = new Player("Mo", "Salah", PlayerPosition.MIDFIELDER, liverpool);
        defender = new Player("Virgil", "Van Dijk", PlayerPosition.DEFENDER, liverpool);
        captain = new Player("Jordan", "Henderson", PlayerPosition.MIDFIELDER, liverpool);
        captain.setCaptain(true);
    }

    @Test
    void testGoalMidfielder() {
        ScoreEvent goal = new ScoreEvent(midfielder, 30, ScoreType.GOAL);
        int points = ScoreCalculator.calculatePoints(goal);
        assertEquals(5, points); // Midfielder goal = 5
    }

    @Test
    void testAssistDefender() {
        ScoreEvent assist = new ScoreEvent(defender, 45, ScoreType.ASSIST);
        int points = ScoreCalculator.calculatePoints(assist);
        assertEquals(3, points);
    }

    @Test
    void testCaptainGetsDoublePoints() {
        ScoreEvent goal = new ScoreEvent(captain, 20, ScoreType.GOAL);
        int points = ScoreCalculator.calculatePoints(goal);
        assertEquals(10, points); // Midfielder goal x2
    }

    @Test
    void testNegativeEvent() {
        ScoreEvent redCard = new ScoreEvent(midfielder, 90, ScoreType.RED_CARD);
        int points = ScoreCalculator.calculatePoints(redCard);
        assertEquals(-5, points);
    }

    @Test
    void testMixedEventsTotal() {
        List<ScoreEvent> events = List.of(
                new ScoreEvent(midfielder, 10, ScoreType.GOAL),
                new ScoreEvent(midfielder, 50, ScoreType.ASSIST),
                new ScoreEvent(midfielder, 85, ScoreType.YELLOW_CARD)
        );
        int total = ScoreCalculator.calculatePointsForPlayer(midfielder, events);
        assertEquals(5 + 3 - 1, total);
    }

    @Test
    void testUnknownScoreTypeThrows() {
        ScoreType fakeType = ScoreType.valueOf("GOAL");
        Player unknown = new Player("Test", "Unknown", null, new Team(TeamName.Liverpool.name()));
        ScoreEvent corrupted = new ScoreEvent(unknown, 10, fakeType);

        assertThrows(UnknownScoreRuleException.class, () -> ScoreCalculator.calculatePoints(corrupted));
    }
}
