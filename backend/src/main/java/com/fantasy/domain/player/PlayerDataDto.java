package com.fantasy.domain.player;

import java.util.List;

public class PlayerDataDto {
    private int playerId;
    private Integer points;
    private String nextFixture;
    private List<String> nextFixtures;
    private boolean fixturePostponed;
    private boolean leagueGameweekLeader;

    public PlayerDataDto(int playerId, Integer points, String fixture) {
        this(playerId, points, fixture == null ? List.of() : List.of(fixture), false);
    }

    public PlayerDataDto(int playerId,
                         Integer points,
                         List<String> fixtures,
                         boolean fixturePostponed) {
        this(playerId, points, fixtures, fixturePostponed, false);
    }

    public PlayerDataDto(int playerId,
                         Integer points,
                         List<String> fixtures,
                         boolean fixturePostponed,
                         boolean leagueGameweekLeader) {
        this.playerId = playerId;
        this.points = points;
        this.nextFixtures = fixtures == null ? List.of() : List.copyOf(fixtures);
        this.nextFixture = this.nextFixtures.isEmpty() ? null : String.join(", ", this.nextFixtures);
        this.fixturePostponed = fixturePostponed;
        this.leagueGameweekLeader = leagueGameweekLeader;
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

    public List<String> getNextFixtures() { return nextFixtures; }

    public boolean isFixturePostponed() { return fixturePostponed; }

    public boolean isLeagueGameweekLeader() { return leagueGameweekLeader; }
}
