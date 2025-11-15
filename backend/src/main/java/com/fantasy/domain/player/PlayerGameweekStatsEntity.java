package com.fantasy.domain.player;

import jakarta.persistence.*;

@Entity
@Table(name = "player_gameweek_stats",
        uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "gameweek"}))
public class PlayerGameweekStatsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private PlayerEntity player;

    private int gameweek;
    private int opponentTeamId;
    private boolean wasHome;

    private int minutesPlayed;
    private int goals;
    private int assists;
    private int goalsConceded;
    private boolean cleanSheet;

    private boolean cleanSheet30;
    private boolean cleanSheet45;
    private boolean cleanSheet60;

    private int yellowCards;
    private int redCards;
    private int penaltiesSaved;
    private int penaltiesMissed;

    private boolean started;

    private int totalPoints;

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PlayerEntity getPlayer() { return player; }
    public void setPlayer(PlayerEntity player) { this.player = player; }

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

    public boolean isCleanSheet() { return cleanSheet; }
    public void setCleanSheet(boolean cleanSheet) { this.cleanSheet = cleanSheet; }

    public boolean isCleanSheet30() { return cleanSheet30; }
    public void setCleanSheet30(boolean cleanSheet30) { this.cleanSheet30 = cleanSheet30; }

    public boolean isCleanSheet45() { return cleanSheet45; }
    public void setCleanSheet45(boolean cleanSheet45) { this.cleanSheet45 = cleanSheet45; }

    public boolean isCleanSheet60() { return cleanSheet60; }
    public void setCleanSheet60(boolean cleanSheet60) { this.cleanSheet60 = cleanSheet60; }

    public int getYellowCards() { return yellowCards; }
    public void setYellowCards(int yellowCards) { this.yellowCards = yellowCards; }

    public int getRedCards() { return redCards; }
    public void setRedCards(int redCards) { this.redCards = redCards; }

    public int getPenaltiesSaved() { return penaltiesSaved; }
    public void setPenaltiesSaved(int penaltiesSaved) { this.penaltiesSaved = penaltiesSaved; }

    public int getPenaltiesMissed() { return penaltiesMissed; }
    public void setPenaltiesMissed(int penaltiesMissed) { this.penaltiesMissed = penaltiesMissed; }

    public boolean isStarted() { return started; }
    public void setStarted(boolean started) { this.started = started; }


    public int getTotalPoints() { return totalPoints; }
    public void setTotalPoints(int totalPoints) { this.totalPoints = totalPoints; }
}

