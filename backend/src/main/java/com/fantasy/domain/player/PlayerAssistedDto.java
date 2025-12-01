package com.fantasy.domain.player;

public class PlayerAssistedDto {
    private int playerId;
    private int numOfAssist;
    private String viewName;
    private int teamId;

    public PlayerAssistedDto(int playerId, String viewName, int numOfAssist, int teamId) {
        this.playerId = playerId;
        this.viewName = viewName;
        this.numOfAssist = numOfAssist;
        this.teamId = teamId;
    }

    public int getPlayerId() {
        return playerId;
    }
    public void setPlayerId(int playerId) {
        this.playerId = playerId;
    }

    public int getNumOfAssist() {
        return numOfAssist;
    }
    public void setNumOfAssist(int numOfAssist) {
        this.numOfAssist = numOfAssist;
    }

    public String getViewName() {
        return viewName;
    }
    public void setViewName(String viewName) {
        this.viewName = viewName;
    }

    public int getTeamId() {
        return teamId;
    }
    public void setTeamId(int teamId) {
        this.teamId = teamId;
    }
}
