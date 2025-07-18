package com.fantasy.Match;

import com.fantasy.Intefaces.ITeam;
import com.fantasy.Match.Exception.TeamNotPartOfTheMatchException;
import com.fantasy.RealWorldData.Team;
import com.fantasy.ScoreEvent.ScoreEvent;
import com.fantasy.ScoreEvent.ScoreType;

import java.util.ArrayList;
import java.util.List;
//TODO: Add exceptions
public class Match {
    private ITeam homeTeam;
    private ITeam awayTeam;
    private int homeTeamScore;
    private int awayTeamScore;
    private List<ScoreEvent> events;

    public Match(ITeam homeTeam, ITeam awayTeam) {
        setHomeTeam(homeTeam);
        setAwayTeam(awayTeam);
        setHomeTeamScore(0);
        setAwayTeamScore(0);
        setEvents();
    }
    // <editor-fold desc="Getters and Setters">
    public ITeam getHomeTeam() {
        return homeTeam;
    }

    public void setHomeTeam(ITeam homeTeam) {
        this.homeTeam = homeTeam;
    }

    public ITeam getAwayTeam() {
        return awayTeam;
    }

    public void setAwayTeam(ITeam awayTeam) {
        this.awayTeam = awayTeam;
    }

    public int getHomeTeamScore() {
        return homeTeamScore;
    }

    public void setHomeTeamScore(int homeTeamScore) {
        this.homeTeamScore = homeTeamScore;
    }

    public int getAwayTeamScore() {
        return awayTeamScore;
    }

    public void setAwayTeamScore(int awayTeamScore) {
        this.awayTeamScore = awayTeamScore;
    }

    public List<ScoreEvent> getEvents() {
        return events;
    }

    public void setEvents() {
        this.events = new ArrayList<>();
    }

    // </editor-fold>

    public void updateMatch(ScoreEvent event){
        this.events.add(event);
        if (event.getType().equals(ScoreType.GOAL)){
            ITeam team = event.getPlayer().getTeam();
            if (this.homeTeam.equals(team))
                setHomeTeamScore(1);
            else
                if (this.awayTeam.equals(team))
                    setAwayTeamScore(1);
                else
                    throw new TeamNotPartOfTheMatchException("Scoring team is not part of this match");
        }
    }
}
