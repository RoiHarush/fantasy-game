package com.fantasy.domain.game;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "gameweek_daily_status",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"gameweek_id", "match_date"})
        })
public class GameweekDailyStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gameweek_id", nullable = false)
    private Integer gameweekId;

    @Column(name = "match_date", nullable = false)
    private LocalDate matchDate;

    @Column(name = "is_calculated", nullable = false)
    private boolean isCalculated;

    @Column(name = "calculated_at")
    private LocalDateTime calculatedAt;

    public GameweekDailyStatus() {}

    public GameweekDailyStatus(Integer gameweekId, LocalDate matchDate) {
        this.gameweekId = gameweekId;
        this.matchDate = matchDate;
        this.isCalculated = false;
    }

    public void markAsCalculated() {
        this.isCalculated = true;
        this.calculatedAt = LocalDateTime.now();
    }

    public boolean isCalculated() {
        return isCalculated;
    }
    public void setCalculated(boolean calculated) {
        isCalculated = calculated;
    }

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }
    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }

    public LocalDate getMatchDate() {
        return matchDate;
    }
    public void setMatchDate(LocalDate matchDate) {
        this.matchDate = matchDate;
    }

    public Integer getGameweekId() {
        return gameweekId;
    }
    public void setGameweekId(Integer gameweekId) {
        this.gameweekId = gameweekId;
    }

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
}