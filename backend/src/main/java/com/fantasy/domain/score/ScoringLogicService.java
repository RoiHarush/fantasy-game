package com.fantasy.domain.score;


import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.RawGameStats;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ScoringLogicService {

    public int calculatePoints(Player domainPlayer, RawGameStats raw) {
        List<ScoreEvent> events = generateScoreEvents(domainPlayer, raw);
        return ScoreCalculator.calculatePointsForPlayer(events);
    }

    public void updateStatsEntity(PlayerGameweekStatsEntity targetEntity, Player domainPlayer, RawGameStats raw) {
        targetEntity.setMinutesPlayed(raw.minutes());
        targetEntity.setGoals(raw.goals());
        targetEntity.setAssists(raw.assists());
        targetEntity.setGoalsConceded(raw.goalsConceded());
        targetEntity.setYellowCards(raw.yellowCards());
        targetEntity.setRedCards(raw.redCards());
        targetEntity.setPenaltiesSaved(raw.penaltiesSaved());
        targetEntity.setPenaltiesMissed(raw.penaltiesMissed());
        targetEntity.setOwnGoals(raw.ownGoals());
        targetEntity.setStarted(raw.started());
        targetEntity.setOpponentTeamId(raw.opponentTeamId());
        targetEntity.setWasHome(raw.wasHome());

        boolean isCleanSheet30 = (raw.goalsConceded() == 0 && raw.minutes() >= 30);

        targetEntity.setCleanSheet(isCleanSheet30);
        targetEntity.setCleanSheet30(isCleanSheet30);

        targetEntity.setCleanSheet45(raw.goalsConceded() == 0 && raw.minutes() >= 46);
        targetEntity.setCleanSheet60(raw.goalsConceded() == 0 && raw.minutes() >= 60);


        int totalPoints = calculatePoints(domainPlayer, raw);
        targetEntity.setTotalPoints(totalPoints);
    }


    private List<ScoreEvent> generateScoreEvents(Player player, RawGameStats stats) {
        List<ScoreEvent> events = new ArrayList<>();

        if (stats.minutes() > 0) {
            events.add(new ScoreEvent(player, 0, stats.started() ? ScoreType.PLAYED : ScoreType.FROM_BENCH));
        }

        for (int i = 0; i < stats.goals(); i++) {
            ScoreEvent ev = new ScoreEvent(player, 0, ScoreType.GOAL);
            ev.setGoalIndex(i + 1);
            events.add(ev);
        }

        for (int i = 0; i < stats.assists(); i++) {
            events.add(new ScoreEvent(player, 0, ScoreType.ASSIST));
        }

        if (stats.minutes() >= 30 && stats.goalsConceded() == 0) {
            events.add(new ScoreEvent(player, stats.minutes(), ScoreType.CLEAN_SHEET));
        }

        if (stats.goalsConceded() > 0) {
            ScoreEvent ev = new ScoreEvent(player, stats.minutes(), ScoreType.GOAL_CONCEDED);
            ev.setGoalsConceded(stats.goalsConceded());
            events.add(ev);
        }

        for (int i = 0; i < stats.yellowCards(); i++) events.add(new ScoreEvent(player, 0, ScoreType.YELLOW_CARD));
        for (int i = 0; i < stats.redCards(); i++) events.add(new ScoreEvent(player, 0, ScoreType.RED_CARD));
        for (int i = 0; i < stats.ownGoals(); i++) events.add(new ScoreEvent(player, 0, ScoreType.OWN_GOAL));
        for (int i = 0; i < stats.penaltiesSaved(); i++) events.add(new ScoreEvent(player, 0, ScoreType.PENALTY_SAVE));
        for (int i = 0; i < stats.penaltiesMissed(); i++) events.add(new ScoreEvent(player, 0, ScoreType.PENALTY_MISS));

        return events;
    }
}
