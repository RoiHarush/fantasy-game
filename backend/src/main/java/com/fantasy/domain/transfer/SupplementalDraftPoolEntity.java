package com.fantasy.domain.transfer;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.player.PlayerEntity;
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
        name = "league_supplemental_draft_pool",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_supplemental_pool_league_player",
                columnNames = {"league_id", "player_id"}
        )
)
public class SupplementalDraftPoolEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id", nullable = false)
    private LeagueEntity league;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "player_id", nullable = false)
    private PlayerEntity player;

    private LocalDateTime discoveredAt;

    public Long getId() { return id; }
    public LeagueEntity getLeague() { return league; }
    public PlayerEntity getPlayer() { return player; }
    public LocalDateTime getDiscoveredAt() { return discoveredAt; }

    public void setLeague(LeagueEntity league) { this.league = league; }
    public void setPlayer(PlayerEntity player) { this.player = player; }
    public void setDiscoveredAt(LocalDateTime discoveredAt) { this.discoveredAt = discoveredAt; }
}
