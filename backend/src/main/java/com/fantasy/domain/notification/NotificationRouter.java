package com.fantasy.domain.notification;

import com.fantasy.config.WebSocketPresenceService;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;

@Service
public class NotificationRouter {
    private static final Logger log = LoggerFactory.getLogger(NotificationRouter.class);

    private final WebSocketPresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebPushSender webPushSender;
    private final NotificationDeliveryRepository deliveryRepository;
    private final UserRepository userRepository;

    public NotificationRouter(WebSocketPresenceService presenceService,
                              SimpMessagingTemplate messagingTemplate,
                              WebPushSender webPushSender,
                              NotificationDeliveryRepository deliveryRepository,
                              UserRepository userRepository) {
        this.presenceService = presenceService;
        this.messagingTemplate = messagingTemplate;
        this.webPushSender = webPushSender;
        this.deliveryRepository = deliveryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void route(Collection<Integer> userIds, NotificationEvent event) {
        userIds.stream().distinct().forEach(userId -> route(userId, event));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void route(int userId, NotificationEvent event) {
        if (event.eventId() == null || event.eventId().isBlank()) {
            throw new IllegalArgumentException("Notification eventId is required");
        }
        if (deliveryRepository.existsByEventIdAndUser_Id(event.eventId(), userId)) return;

        boolean active = presenceService.isActive(userId);
        String channel;
        if (active && event.policy() == NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE) {
            messagingTemplate.convertAndSendToUser(String.valueOf(userId), "/queue/notifications", event);
            channel = "WEBSOCKET";
        } else if (!active) {
            channel = webPushSender.send(userId, event) ? "PUSH" : "NO_SUBSCRIPTION";
        } else {
            channel = "ACTIVE_UI_ONLY";
        }

        UserEntity user = userRepository.findById(userId).orElse(null);
        if (user == null) return;
        NotificationDeliveryEntity delivery = new NotificationDeliveryEntity();
        delivery.setEventId(event.eventId());
        delivery.setUser(user);
        delivery.setChannel(channel);
        delivery.setDeliveredAt(LocalDateTime.now());
        try {
            deliveryRepository.saveAndFlush(delivery);
        } catch (DataIntegrityViolationException duplicate) {
            log.debug("Notification already routed concurrently: eventId={}, userId={}", event.eventId(), userId);
        }
    }
}
