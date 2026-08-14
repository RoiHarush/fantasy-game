package com.fantasy.domain.ai;

import com.fantasy.domain.team.UserGameDataEntity;
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
        name = "ai_roasts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "gameweek"})
)
public class AiRoastEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserGameDataEntity user;

    @Column(nullable = false)
    private int gameweek;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false, length = 64)
    private String provider;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    public Long getId() { return id; }
    public UserGameDataEntity getUser() { return user; }
    public void setUser(UserGameDataEntity user) { this.user = user; }
    public int getGameweek() { return gameweek; }
    public void setGameweek(int gameweek) { this.gameweek = gameweek; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}

