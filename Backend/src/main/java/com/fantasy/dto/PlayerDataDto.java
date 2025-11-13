package com.fantasy.dto;

public class PlayerDataDto {
    private int playerId;
    private Integer points;
    private String nextFixture;

    public PlayerDataDto(int playerId, Integer points, String fixture) {
        this.playerId = playerId;
        this.points = points;
        this.nextFixture = fixture;
    }

    public int getPlayerId() {
        return playerId;
    }

    public Integer getPoints() {
        return points;
    }

    public String getNextFixture(){
        return nextFixture;
    }
}
