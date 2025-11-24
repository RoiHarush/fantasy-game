package com.fantasy.dto;

public class UpdateAssistRequest {
    private int playerId;
    private int gameweek;
    private String action;

    public int getPlayerId() {
        return playerId;
    }
    public void setPlayerId(int playerId) {
        this.playerId = playerId;
    }

    public int getGameweek() {
        return gameweek;
    }
    public void setGameweek(int gameweek) {
        this.gameweek = gameweek;
    }

    public String getAction() {
        return action;
    }
    public void setAction(String action) {
        this.action = action;
    }
}