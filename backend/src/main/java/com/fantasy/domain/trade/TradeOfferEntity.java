package com.fantasy.domain.trade;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.user.UserEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trade_offers")
public class TradeOfferEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "league_id", nullable = false)
    private LeagueEntity league;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proposer_user_id", nullable = false)
    private UserEntity proposer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private UserEntity recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TradeOfferStatus status = TradeOfferStatus.PENDING;

    @Column(length = 500)
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @OneToMany(mappedBy = "offer", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<TradeOfferItemEntity> items = new ArrayList<>();

    @Version
    @Column(nullable = false)
    private long version;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }

    public void addItem(TradeOfferItemEntity item) {
        item.setOffer(this);
        item.setSortOrder(items.size());
        items.add(item);
    }

    public void finish(TradeOfferStatus nextStatus) {
        status = nextStatus;
        respondedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public LeagueEntity getLeague() { return league; }
    public void setLeague(LeagueEntity league) { this.league = league; }
    public UserEntity getProposer() { return proposer; }
    public void setProposer(UserEntity proposer) { this.proposer = proposer; }
    public UserEntity getRecipient() { return recipient; }
    public void setRecipient(UserEntity recipient) { this.recipient = recipient; }
    public TradeOfferStatus getStatus() { return status; }
    public void setStatus(TradeOfferStatus status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getRespondedAt() { return respondedAt; }
    public List<TradeOfferItemEntity> getItems() { return items; }
    public long getVersion() { return version; }
}

