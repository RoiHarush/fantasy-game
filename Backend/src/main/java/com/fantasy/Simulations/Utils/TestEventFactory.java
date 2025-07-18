package com.fantasy.Simulations.Utils;

import com.fantasy.Player.Player;
import com.fantasy.FantasyTeam.FantasyTeam;
import com.fantasy.ScoreEvent.ScoreEvent;
import com.fantasy.ScoreEvent.ScoreEventRepository;
import com.fantasy.ScoreEvent.ScoreType;

import java.util.List;
import java.util.Random;

public class TestEventFactory {

    private static final ScoreType[] POSSIBLE_EVENTS = {
            ScoreType.GOAL,
            ScoreType.ASSIST,
            ScoreType.YELLOW_CARD,
    };

    private static final Random rand = new Random();

    public static ScoreEventRepository generateRandomEvents(FantasyTeam team, int gameWeek) {
        ScoreEventRepository repo = new ScoreEventRepository();

        List<Player> starters = team.getSquad().getStartingLineup();
        for (Player player : starters) {
            int numEvents = rand.nextInt(3); // 0 to 2 events per player
            for (int i = 0; i < numEvents; i++) {
                ScoreType type = POSSIBLE_EVENTS[rand.nextInt(POSSIBLE_EVENTS.length)];
                int minute = rand.nextInt(90) + 1;
                repo.addEvent(new ScoreEvent(player, minute, type), gameWeek);
            }
        }

        return repo;
    }
}
