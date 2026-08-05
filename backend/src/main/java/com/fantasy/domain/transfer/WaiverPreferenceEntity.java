package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.user.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "waiver_preferences",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_waiver_user_gw_priority",
                columnNames = {"league_id", "user_id", "gameweek_id", "priority"}
        )
)
public class WaiverPreferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id", nullable = false)
    private LeagueEntity league;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gameweek_id", nullable = false)
    private GameWeekEntity gameWeek;

    @Column(nullable = false)
    private int priority;

    @Column(name = "player_in_id", nullable = false)
    private int playerInId;

    @Column(name = "player_out_id", nullable = false)
    private int playerOutId;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public LeagueEntity getLeague() { return league; }
    public UserEntity getUser() { return user; }
    public GameWeekEntity getGameWeek() { return gameWeek; }
    public int getPriority() { return priority; }
    public int getPlayerInId() { return playerInId; }
    public int getPlayerOutId() { return playerOutId; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setLeague(LeagueEntity league) { this.league = league; }
    public void setUser(UserEntity user) { this.user = user; }
    public void setGameWeek(GameWeekEntity gameWeek) { this.gameWeek = gameWeek; }
    public void setPriority(int priority) { this.priority = priority; }
    public void setPlayerInId(int playerInId) { this.playerInId = playerInId; }
    public void setPlayerOutId(int playerOutId) { this.playerOutId = playerOutId; }
}
