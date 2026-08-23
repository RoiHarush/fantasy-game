package com.fantasy.domain.ai;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.team.UserGameDataEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_coach_threads", uniqueConstraints =
        @UniqueConstraint(columnNames = {"user_id", "gameweek"}))
public class AiCoachThreadEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserGameDataEntity user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id", nullable = false)
    private LeagueEntity league;
    @Column(nullable = false)
    private int gameweek;
    @Column(name = "snapshot_hash", nullable = false, length = 96)
    private String snapshotHash;
    @Column(name = "analysis_json", nullable = false, columnDefinition = "TEXT")
    private String analysisJson;
    @Column(nullable = false, length = 64)
    private String provider;
    @Column(nullable = false, length = 128)
    private String model;
    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;
    @Column(name = "data_as_of", nullable = false)
    private LocalDateTime dataAsOf;

    public Long getId() { return id; }
    public UserGameDataEntity getUser() { return user; }
    public void setUser(UserGameDataEntity user) { this.user = user; }
    public LeagueEntity getLeague() { return league; }
    public void setLeague(LeagueEntity league) { this.league = league; }
    public int getGameweek() { return gameweek; }
    public void setGameweek(int gameweek) { this.gameweek = gameweek; }
    public String getSnapshotHash() { return snapshotHash; }
    public void setSnapshotHash(String snapshotHash) { this.snapshotHash = snapshotHash; }
    public String getAnalysisJson() { return analysisJson; }
    public void setAnalysisJson(String analysisJson) { this.analysisJson = analysisJson; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
    public LocalDateTime getDataAsOf() { return dataAsOf; }
    public void setDataAsOf(LocalDateTime dataAsOf) { this.dataAsOf = dataAsOf; }
}
