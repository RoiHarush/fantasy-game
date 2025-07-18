package com.fantasy.ScoreEventTest;

import com.fantasy.Player.Player;
import com.fantasy.Player.PlayerPosition;
import com.fantasy.RealWorldData.Team;
import com.fantasy.ScoreEvent.ScoreEvent;
import com.fantasy.ScoreEvent.ScoreEventRepository;
import com.fantasy.ScoreEvent.ScoreType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ScoreEventRepositoryTest {

    private ScoreEventRepository repository;
    private Player player1;
    private Player player2;

    @BeforeEach
    public void setUp() {
        repository = new ScoreEventRepository();
        player1 = new Player("John", "Doe", PlayerPosition.FORWARD, new Team("Arsenal"));
        player2 = new Player("Jane", "Smith", PlayerPosition.MIDFIELDER, new Team("Liverpool"));
    }

    @Test
    public void testAddSingleEventAndRetrieveIt() {
        ScoreEvent event = new ScoreEvent(player1, 45, ScoreType.GOAL);
        repository.addEvent(event, 1);

        List<ScoreEvent> events = repository.getAllEventsInGameWeek(1);
        assertEquals(1, events.size());
        assertEquals(player1, events.get(0).getPlayer());
    }

    @Test
    public void testGetEventsForPlayerInGameWeek() {
        repository.addEvent(new ScoreEvent(player1, 10, ScoreType.GOAL), 2);
        repository.addEvent(new ScoreEvent(player2, 20, ScoreType.ASSIST), 2);
        repository.addEvent(new ScoreEvent(player1, 55, ScoreType.YELLOW_CARD), 2);

        List<ScoreEvent> events = repository.getEventsForPlayerInGameWeek(player1, 2);
        assertEquals(2, events.size());
        assertTrue(events.stream().allMatch(e -> e.getPlayer().equals(player1)));
    }

    @Test
    public void testGetEventsForEmptyGameWeek() {
        List<ScoreEvent> events = repository.getAllEventsInGameWeek(99);
        assertNotNull(events);
        assertTrue(events.isEmpty());
    }

    @Test
    public void testGetEventsForPlayerWithNoEvents() {
        repository.addEvent(new ScoreEvent(player1, 5, ScoreType.RED_CARD), 3);

        List<ScoreEvent> events = repository.getEventsForPlayerInGameWeek(player2, 3);
        assertNotNull(events);
        assertTrue(events.isEmpty());
    }
}
