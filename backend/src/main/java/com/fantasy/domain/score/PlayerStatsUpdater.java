package com.fantasy.domain.score;

import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerFixtureStatsEntity;
import com.fantasy.domain.player.RawGameStats;
import org.springframework.stereotype.Service;

@Service
public class PlayerStatsUpdater {

    private final LeagueScoringService leagueScoringService;

    public PlayerStatsUpdater(LeagueScoringService leagueScoringService) {
        this.leagueScoringService = leagueScoringService;
    }

    public void update(PlayerGameweekStatsEntity target, RawGameStats raw) {
        target.setMinutesPlayed(raw.minutes());
        target.setGoals(raw.goals());
        target.setAssists(raw.assists());
        target.setGoalsConceded(raw.goalsConceded());
        target.setYellowCards(raw.yellowCards());
        target.setRedCards(raw.redCards());
        target.setPenaltiesSaved(raw.penaltiesSaved());
        target.setPenaltiesMissed(raw.penaltiesMissed());
        target.setOwnGoals(raw.ownGoals());
        target.setStarted(raw.started());
        target.setOpponentTeamId(raw.opponentTeamId());
        target.setWasHome(raw.wasHome());

        boolean cleanSheet30 = raw.goalsConceded() == 0 && raw.minutes() >= 30;
        target.setCleanSheet(cleanSheet30);
        target.setCleanSheet30(cleanSheet30);
        target.setCleanSheet45(raw.goalsConceded() == 0 && raw.minutes() >= 46);
        target.setCleanSheet60(raw.goalsConceded() == 0 && raw.minutes() >= 60);
        target.setTotalPoints(leagueScoringService.calculatePlayerPoints(target, null));
    }

    public void update(PlayerFixtureStatsEntity target, RawGameStats raw) {
        target.setMinutesPlayed(raw.minutes());
        target.setGoals(raw.goals());
        target.setAssists(raw.assists());
        target.setGoalsConceded(raw.goalsConceded());
        target.setYellowCards(raw.yellowCards());
        target.setRedCards(raw.redCards());
        target.setPenaltiesSaved(raw.penaltiesSaved());
        target.setPenaltiesMissed(raw.penaltiesMissed());
        target.setOwnGoals(raw.ownGoals());
        target.setStarted(raw.started());
        target.setOpponentTeamId(raw.opponentTeamId());
        target.setWasHome(raw.wasHome());
        target.setTotalPoints(leagueScoringService.calculateFixturePlayerScore(target, null).totalPoints());
    }
}
