package com.fantasy.dto;

public class PlayerPenaltyDto {
    private int playerId;
    private String viewName;
    private int penaltiesConceded;
    private int teamId;

    public PlayerPenaltyDto(int playerId, String viewName, int penaltiesConceded, int teamId) {
        this.playerId = playerId;
        this.viewName = viewName;
        this.penaltiesConceded = penaltiesConceded;
        this.teamId = teamId;
    }

    public int getPlayerId() { return playerId; }
    public String getViewName() { return viewName; }
    public int getPenaltiesConceded() { return penaltiesConceded; }
    public int getTeamId() { return teamId; }
}
