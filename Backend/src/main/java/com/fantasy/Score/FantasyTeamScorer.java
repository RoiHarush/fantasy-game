package com.fantasy.Score;

import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.Player.Player;
import com.fantasy.ScoreEvent.ScoreEvent;
import com.fantasy.ScoreEvent.ScoreEventRepository;

import java.util.List;

public class FantasyTeamScorer {

    private final ScoreEventRepository repository;

    public FantasyTeamScorer(ScoreEventRepository repository) {
        this.repository = repository;
    }

    public int calculateTeamPoints(FantasyTeam team, int gameWeekNumber) {
        int totalPoints = 0;

        List<Player> starters = team.getSquad().getStartingLineup();

        for (Player player : starters) {
            List<ScoreEvent> events = repository.getEventsForPlayerInGameWeek(player, gameWeekNumber);
            int playerPoints = ScoreCalculator.calculatePointsForPlayer(player, events);

            totalPoints += playerPoints;
        }

        return totalPoints;
    }
}

