package com.fantasy.dto;

public class GameweekHistoryDto {
    private Integer gameweek;
    private Integer points;
    private Integer totalPoints;

    public GameweekHistoryDto(Integer gameweek, Integer points, Integer totalPoints) {
        this.gameweek = gameweek;
        this.points = points;
        this.totalPoints = totalPoints;
    }

    public Integer getGameweek() {
        return gameweek;
    }

    public void setGameweek(Integer gameweek) {
        this.gameweek = gameweek;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public Integer getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(Integer totalPoints) {
        this.totalPoints = totalPoints;
    }
}
