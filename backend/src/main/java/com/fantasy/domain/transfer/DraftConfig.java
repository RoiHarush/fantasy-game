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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private DraftType draftType = DraftType.INITIAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private DraftOrderSource orderSource = DraftOrderSource.TRANSFER_ORDER;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "league_draft_config_order",
            joinColumns = @JoinColumn(name = "config_id")
    )
    @OrderColumn(name = "pick_position")
    @Column(name = "user_id", nullable = false)
    private java.util.List<Integer> manualOrder = new java.util.ArrayList<>();

    public Long getId() { return id; }
    @JsonIgnore
    public LeagueEntity getLeague() { return league; }
    public void setLeague(LeagueEntity league) { this.league = league; }
    public LocalDateTime getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(LocalDateTime scheduledTime) { this.scheduledTime = scheduledTime; }
    public boolean isProcessed() { return processed; }
    public void setProcessed(boolean processed) { this.processed = processed; }
    public DraftType getDraftType() { return draftType; }
    public void setDraftType(DraftType draftType) { this.draftType = draftType; }
    public DraftOrderSource getOrderSource() { return orderSource; }
    public void setOrderSource(DraftOrderSource orderSource) { this.orderSource = orderSource; }
    public java.util.List<Integer> getManualOrder() { return manualOrder; }
    public void setManualOrder(java.util.List<Integer> manualOrder) {
        this.manualOrder = manualOrder == null
                ? new java.util.ArrayList<>()
                : new java.util.ArrayList<>(manualOrder);
    }
}
