package com.fantasy.domain.player;

public interface ScorablePlayerStats {
    PlayerEntity getPlayer();
    int getGameweek();
    int getMinutesPlayed();
    int getGoals();
    int getAssists();
    int getGoalsConceded();
    int getYellowCards();
    int getRedCards();
    int getPenaltiesSaved();
    int getPenaltiesMissed();
    int getOwnGoals();
    int getPenaltiesConceded();
    boolean isStarted();
}
