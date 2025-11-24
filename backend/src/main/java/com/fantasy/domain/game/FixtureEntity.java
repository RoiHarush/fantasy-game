package com.fantasy.domain.game;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "fixtures")
public class FixtureEntity {
    @Id
    private int id;

    private int gameweekId;
    private int homeTeamId;
    private int awayTeamId;

    private LocalDateTime kickoffTime;

    private Integer scoreHome;
    private Integer scoreAway;

    private Integer homeDifficulty;
    private Integer awayDifficulty;

    private boolean started;
    private boolean finished;
    private int minutes;

    public FixtureEntity() {
    }

    public FixtureEntity(int id, int gameweekId, int homeTeamId, int awayTeamId, LocalDateTime kickoffTime, Integer scoreHome, Integer scoreAway) {
        this.id = id;
        this.gameweekId = gameweekId;
        this.homeTeamId = homeTeamId;
        this.awayTeamId = awayTeamId;
        this.kickoffTime = kickoffTime;
        this.scoreHome = scoreHome;
        this.scoreAway = scoreAway;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getGameweekId() { return gameweekId; }
    public void setGameweekId(int gameweekId) { this.gameweekId = gameweekId; }

    public int getHomeTeamId() { return homeTeamId; }
    public void setHomeTeamId(int homeTeamId) { this.homeTeamId = homeTeamId; }

    public int getAwayTeamId() { return awayTeamId; }
    public void setAwayTeamId(int awayTeamId) { this.awayTeamId = awayTeamId; }

    public LocalDateTime getKickoffTime() { return kickoffTime; }
    public void setKickoffTime(LocalDateTime kickoffTime) { this.kickoffTime = kickoffTime; }

    public Integer getHomeTeamScore() { return scoreHome; }
    public void setHomeTeamScore(Integer scoreHome) { this.scoreHome = scoreHome; }

    public Integer getAwayTeamScore() { return scoreAway; }
    public void setAwayTeamScore(Integer scoreAway) { this.scoreAway = scoreAway; }

    public Integer getHomeDifficulty() { return homeDifficulty; }
    public void setHomeDifficulty(Integer homeDifficulty) { this.homeDifficulty = homeDifficulty; }

    public Integer getAwayDifficulty() { return awayDifficulty; }
    public void setAwayDifficulty(Integer awayDifficulty) { this.awayDifficulty = awayDifficulty; }

    public boolean isStarted() { return started; }
    public void setStarted(boolean started) { this.started = started; }

    public boolean isFinished() { return finished; }
    public void setFinished(boolean finished) { this.finished = finished; }

    public int getMinutes() { return minutes; }
    public void setMinutes(int minutes) { this.minutes = minutes; }
}