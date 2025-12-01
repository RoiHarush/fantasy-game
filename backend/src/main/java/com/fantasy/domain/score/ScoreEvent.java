package com.fantasy.domain.score;

import com.fantasy.domain.player.Player;
//TODO: Add exceptions

public class ScoreEvent {
    private Player player;
    private ScoreType type;

    private int goalIndex;
    private int minutesPlayed;
    private int goalsConceded;
    private boolean penaltyScored;
    private boolean takenBySamePlayer;

    public ScoreEvent(Player player, int minutesPlayed, ScoreType type) {
        this.player = player;
        this.minutesPlayed = minutesPlayed;
        this.type = type;
    }

    // --- Getters/Setters ---
    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public ScoreType getType() {
        return type;
    }

    public void setType(ScoreType type) {
        this.type = type;
    }

    public int getGoalIndex() {
        return goalIndex;
    }

    public void setGoalIndex(int goalIndex) {
        this.goalIndex = goalIndex;
    }

    public int getMinutesPlayed() {
        return minutesPlayed;
    }

    public void setMinutesPlayed(int minutesPlayed) {
        this.minutesPlayed = minutesPlayed;
    }

    public int getGoalsConceded() {
        return goalsConceded;
    }

    public void setGoalsConceded(int goalsConceded) {
        this.goalsConceded = goalsConceded;
    }

    public boolean isPenaltyScored() {
        return penaltyScored;
    }

    public void setPenaltyScored(boolean penaltyScored) {
        this.penaltyScored = penaltyScored;
    }

    public boolean isTakenBySamePlayer() {
        return takenBySamePlayer;
    }

    public void setTakenBySamePlayer(boolean takenBySamePlayer) {
        this.takenBySamePlayer = takenBySamePlayer;
    }
}

