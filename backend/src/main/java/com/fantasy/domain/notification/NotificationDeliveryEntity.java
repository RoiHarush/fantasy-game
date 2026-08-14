package com.fantasy.domain.notification;

import com.fantasy.domain.user.UserEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_deliveries", uniqueConstraints =
        @UniqueConstraint(name = "uk_notification_delivery_event_user", columnNames = {"event_id", "user_id"}))
public class NotificationDeliveryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, length = 160)
    private String eventId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false, length = 24)
    private String channel;

    @Column(name = "delivered_at", nullable = false)
    private LocalDateTime deliveredAt;

    public String getEventId() { return eventId; }
    public UserEntity getUser() { return user; }
    public String getChannel() { return channel; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public void setUser(UserEntity user) { this.user = user; }
    public void setChannel(String channel) { this.channel = channel; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
}
