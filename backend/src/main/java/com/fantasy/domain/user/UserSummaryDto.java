package com.fantasy.domain.user;

public class UserSummaryDto {
    private int id;
    private String name;
    private String fantasyTeamName;
    private int gwPoints;
    private int points;
    private int rank;

    public UserSummaryDto(int id, String name, String fantasyTeam, int points, int gwPoints, int rank) {
        this.id = id;
        this.name = name;
        this.fantasyTeamName = fantasyTeam;
        this.points = points;
        this.gwPoints = gwPoints;
        this.rank = rank;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getFantasyTeamName() {
        return fantasyTeamName;
    }

    public int getPoints() {
        return points;
    }

    public int getRank() {
        return rank;
    }

    public int getGwPoints() {
        return gwPoints;
    }
}
