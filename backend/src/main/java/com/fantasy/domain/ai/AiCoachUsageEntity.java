package com.fantasy.domain.ai;

import com.fantasy.domain.team.UserGameDataEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_coach_usage")
public class AiCoachUsageEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserGameDataEntity user;
    @Column(nullable = false)
    private int gameweek;
    @Column(name = "usage_type", nullable = false, length = 24)
    private String usageType;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public void setUser(UserGameDataEntity user) { this.user = user; }
    public void setGameweek(int gameweek) { this.gameweek = gameweek; }
    public void setUsageType(String usageType) { this.usageType = usageType; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
