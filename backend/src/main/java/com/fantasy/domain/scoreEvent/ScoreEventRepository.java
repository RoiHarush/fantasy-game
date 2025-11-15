package com.fantasy.domain.scoreEvent;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.scoreEvent.Exception.OutOfRangeWeekException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ScoreEventRepository {
    private final Map<Integer, List<ScoreEvent>> eventsByGameWeek = new HashMap<>();

    public void addEvent(ScoreEvent event, int gameWeekNumber) {
        if (gameWeekNumber < 1 || gameWeekNumber > 38) {
            throw new OutOfRangeWeekException("Illegal week number: " + gameWeekNumber);
        }

        eventsByGameWeek
                .computeIfAbsent(gameWeekNumber, k -> new ArrayList<>())
                .add(event);
    }

    public List<ScoreEvent> getEventsForPlayerInGameWeek(Player player, int gameWeekNumber) {
        return eventsByGameWeek.getOrDefault(gameWeekNumber, List.of()).stream()
                .filter(event -> event.getPlayer().equals(player))
                .toList();
    }

    public List<ScoreEvent> getAllEventsInGameWeek(int gameWeekNumber) {
        return eventsByGameWeek.getOrDefault(gameWeekNumber, List.of());
    }

    public void addGoalEvent(Player player, int minute, int gameWeekNumber) {
        long goalsSoFar = getEventsForPlayerInGameWeek(player, gameWeekNumber).stream()
                .filter(e -> e.getType() == ScoreType.GOAL)
                .count();

        int nextGoalIndex = (int) goalsSoFar + 1;

        ScoreEvent goalEvent = new ScoreEvent(player, minute, ScoreType.GOAL);
        goalEvent.setGoalIndex(nextGoalIndex);

        addEvent(goalEvent, gameWeekNumber);
    }
}
