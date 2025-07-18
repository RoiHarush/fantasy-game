package com.fantasy.ScoreEvent;

import com.fantasy.Player.Player;
import com.fantasy.ScoreEvent.Exception.OutOfRangeWeekException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

//TODO: Add exceptions
public class ScoreEventRepository {
    private final Map<Integer, List<ScoreEvent>> eventsByGameWeek = new HashMap<>();

    public void addEvent(ScoreEvent event, int gameWeekNumber) {
        if (gameWeekNumber < 0 || gameWeekNumber > 38)
            throw new OutOfRangeWeekException("Illegible week number");

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
}

