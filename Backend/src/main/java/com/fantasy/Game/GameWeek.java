package com.fantasy.Game;

import java.time.LocalDateTime;
//TODO: Add exceptions
public class GameWeek {
    private int gameWeekNumber;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public GameWeek(int gameWeekNumber){
        this.startTime = LocalDateTime.now();
        this.endTime = LocalDateTime.now();
    }

    // <editor-fold desc = "Getters and setters">

    public int getGameWeekNumber() {
        return gameWeekNumber;
    }

    public void setGameWeekNumber(int gameWeekNumber) {
        this.gameWeekNumber = gameWeekNumber;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    // </editor-fold>
}