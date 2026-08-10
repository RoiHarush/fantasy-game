package com.fantasy.domain.player;

import com.fantasy.domain.game.FixtureEntity;
import jakarta.persistence.*;

@Entity
@Table(
        name = "player_fixture_stats",
        uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "fixture_id"})
)
public class PlayerFixtureStatsEntity implements ScorablePlayerStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private PlayerEntity player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fixture_id", nullable = false)
    private FixtureEntity fixture;

    private int gameweek;
    private int opponentTeamId;
    private boolean wasHome;
    private int minutesPlayed;
    private int goals;
    private int assists;
    private int goalsConceded;
    private int yellowCards;
    private int redCards;
    private int penaltiesSaved;
    private int penaltiesMissed;
    private int ownGoals;
    private boolean started;
    private int totalPoints;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public PlayerEntity getPlayer() { return player; }
    public void setPlayer(PlayerEntity player) { this.player = player; }
    public FixtureEntity getFixture() { return fixture; }
    public void setFixture(FixtureEntity fixture) { this.fixture = fixture; }
    public int getGameweek() { return gameweek; }
    public void setGameweek(int gameweek) { this.gameweek = gameweek; }
    public int getOpponentTeamId() { return opponentTeamId; }
    public void setOpponentTeamId(int opponentTeamId) { this.opponentTeamId = opponentTeamId; }
    public boolean isWasHome() { return wasHome; }
    public void setWasHome(boolean wasHome) { this.wasHome = wasHome; }
    public int getMinutesPlayed() { return minutesPlayed; }
    public void setMinutesPlayed(int minutesPlayed) { this.minutesPlayed = minutesPlayed; }
    public int getGoals() { return goals; }
    public void setGoals(int goals) { this.goals = goals; }
    public int getAssists() { return assists; }
    public void setAssists(int assists) { this.assists = assists; }
    public int getGoalsConceded() { return goalsConceded; }
    public void setGoalsConceded(int goalsConceded) { this.goalsConceded = goalsConceded; }
    public int getYellowCards() { return yellowCards; }
    public void setYellowCards(int yellowCards) { this.yellowCards = yellowCards; }
    public int getRedCards() { return redCards; }
    public void setRedCards(int redCards) { this.redCards = redCards; }
    public int getPenaltiesSaved() { return penaltiesSaved; }
    public void setPenaltiesSaved(int penaltiesSaved) { this.penaltiesSaved = penaltiesSaved; }
    public int getPenaltiesMissed() { return penaltiesMissed; }
    public void setPenaltiesMissed(int penaltiesMissed) { this.penaltiesMissed = penaltiesMissed; }
    public int getOwnGoals() { return ownGoals; }
    public void setOwnGoals(int ownGoals) { this.ownGoals = ownGoals; }
    public int getPenaltiesConceded() { return 0; }
    public boolean isStarted() { return started; }
    public void setStarted(boolean started) { this.started = started; }
    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }
}
