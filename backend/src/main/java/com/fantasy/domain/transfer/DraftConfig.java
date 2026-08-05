package com.fantasy.domain.transfer;

import com.fantasy.domain.league.LeagueEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "league_draft_config", uniqueConstraints = @UniqueConstraint(columnNames = "league_id"))
public class DraftConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id", nullable = false, unique = true)
    private LeagueEntity league;

    private LocalDateTime scheduledTime;
    private boolean processed = true;

    public Long getId() { return id; }
    @JsonIgnore
    public LeagueEntity getLeague() { return league; }
    public void setLeague(LeagueEntity league) { this.league = league; }
    public LocalDateTime getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(LocalDateTime scheduledTime) { this.scheduledTime = scheduledTime; }
    public boolean isProcessed() { return processed; }
    public void setProcessed(boolean processed) { this.processed = processed; }
}
