package com.fantasy.domain.trade;

import com.fantasy.domain.player.PlayerEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "trade_offer_items")
public class TradeOfferItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offer_id", nullable = false)
    private TradeOfferEntity offer;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proposer_player_id", nullable = false)
    private PlayerEntity proposerPlayer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_player_id", nullable = false)
    private PlayerEntity recipientPlayer;

    public Long getId() { return id; }
    public TradeOfferEntity getOffer() { return offer; }
    public void setOffer(TradeOfferEntity offer) { this.offer = offer; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public PlayerEntity getProposerPlayer() { return proposerPlayer; }
    public void setProposerPlayer(PlayerEntity proposerPlayer) { this.proposerPlayer = proposerPlayer; }
    public PlayerEntity getRecipientPlayer() { return recipientPlayer; }
    public void setRecipientPlayer(PlayerEntity recipientPlayer) { this.recipientPlayer = recipientPlayer; }
}

