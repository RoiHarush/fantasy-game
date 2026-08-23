package com.fantasy.domain.ai;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_coach_messages")
public class AiCoachMessageEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "thread_id", nullable = false)
    private AiCoachThreadEntity thread;
    @Column(nullable = false, length = 16)
    private String role;
    @Column(nullable = false, length = 2000)
    private String content;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public AiCoachThreadEntity getThread() { return thread; }
    public void setThread(AiCoachThreadEntity thread) { this.thread = thread; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
