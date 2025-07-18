package com.fantasy.Simulations;

import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.Player.Player;
import com.fantasy.Score.ScoreCalculator;
import com.fantasy.ScoreEvent.ScoreEventRepository;
import com.fantasy.Simulations.Utils.TestEventFactory;
import com.fantasy.Simulations.Utils.TestTeamFactory;

import java.util.List;

public class ScoreSimulation {
    public static void main(String[] args) {

        // Step 1: Create a fantasy team and players
        FantasyTeam team = TestTeamFactory.createSimulatedTeam("Roi FC");

        // Step 2: Set team's captain
        Player captain = team.getSquad().getStartingLineup().getLast();
        team.setCaptain(captain);

        // Step 3: Create ScoreEventRepository and add events
        int gameWeek = 1;
        ScoreEventRepository repo = TestEventFactory.generateRandomEvents(team, 1);

        // Step 4: Calculate points for each player
        List<Player> starters = team.getSquad().getStartingLineup();
        for (Player player : starters) {
            int points = ScoreCalculator.calculatePointsForPlayer(player, repo.getEventsForPlayerInGameWeek(player, gameWeek));
            player.addPoints(gameWeek, points); // update player
            team.addPoints(gameWeek, points);   // update team
        }

        // Step 5: Print results
        System.out.println("== Player Points in Gameweek " + gameWeek + " ==");
        for (Player player : starters) {
            System.out.println(player.getName() + ": " + player.getPointsForGameWeek(gameWeek) + " points");
        }

        System.out.println("\n== Team Summary: '" + team.getName() + "' ==");
        System.out.println("Gameweek " + gameWeek + ": " + team.getWeeklyPoints(gameWeek) + " points");
        System.out.println("Total points: " + team.getTotalPoints());
    }
}