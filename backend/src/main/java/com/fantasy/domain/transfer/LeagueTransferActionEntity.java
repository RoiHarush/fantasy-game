package com.fantasy.domain.transfer;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.user.UserEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "league_transfer_actions")
public class LeagueTransferActionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id", nullable = false)
    private LeagueEntity league;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gameweek_id", nullable = false)
    private GameWeekEntity gameWeek;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "window_type", nullable = false, length = 16)
    private TransferWindowType windowType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private TransferActionSource source;

    @Column(name = "player_in_id", nullable = false)
    private int playerInId;

    @Column(name = "player_out_id")
    private Integer playerOutId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public LeagueEntity getLeague() { return league; }
    public GameWeekEntity getGameWeek() { return gameWeek; }
    public UserEntity getUser() { return user; }
    public TransferWindowType getWindowType() { return windowType; }
    public TransferActionSource getSource() { return source; }
    public int getPlayerInId() { return playerInId; }
    public Integer getPlayerOutId() { return playerOutId; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setLeague(LeagueEntity league) { this.league = league; }
    public void setGameWeek(GameWeekEntity gameWeek) { this.gameWeek = gameWeek; }
    public void setUser(UserEntity user) { this.user = user; }
    public void setWindowType(TransferWindowType windowType) { this.windowType = windowType; }
    public void setSource(TransferActionSource source) { this.source = source; }
    public void setPlayerInId(int playerInId) { this.playerInId = playerInId; }
    public void setPlayerOutId(Integer playerOutId) { this.playerOutId = playerOutId; }
}
