package com.fantasy.domain.notification;

import com.fantasy.config.WebSocketPresenceService;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class NotificationRouterTest {
    private final WebSocketPresenceService presence = mock(WebSocketPresenceService.class);
    private final SimpMessagingTemplate messaging = mock(SimpMessagingTemplate.class);
    private final WebPushSender push = mock(WebPushSender.class);
    private final NotificationDeliveryRepository deliveries = mock(NotificationDeliveryRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private NotificationRouter router;

    @BeforeEach
    void setUp() {
        router = new NotificationRouter(presence, messaging, push, deliveries, users);
        UserEntity user = new UserEntity();
        user.setId(7);
        when(users.findById(7)).thenReturn(Optional.of(user));
    }

    @Test
    void visibleUserGetsToastChannelWithoutPush() {
        when(presence.isActive(7)).thenReturn(true);
        NotificationEvent event = event(NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE);

        router.route(7, event);

        verify(messaging).convertAndSendToUser("7", "/queue/notifications", event);
        verifyNoInteractions(push);
        assertSavedChannel("WEBSOCKET");
    }

    @Test
    void inactiveUserGetsPushWithoutWebsocketToast() {
        when(presence.isActive(7)).thenReturn(false);
        when(push.send(eq(7), any())).thenReturn(true);
        NotificationEvent event = event(NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE);

        router.route(7, event);

        verify(push).send(7, event);
        verifyNoInteractions(messaging);
        assertSavedChannel("PUSH");
    }

    @Test
    void activeSourceUserDoesNotReceiveTheirOwnToast() {
        when(presence.isActive(7)).thenReturn(true);
        NotificationEvent event = event(NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE);

        router.route(7, event, true);

        verifyNoInteractions(messaging, push);
        assertSavedChannel("SOURCE_TOAST_SUPPRESSED");
    }

    @Test
    void inactiveSourceUserCanStillReceiveTheDevicePush() {
        when(presence.isActive(7)).thenReturn(false);
        when(push.send(7, event(NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE))).thenReturn(true);
        NotificationEvent event = event(NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE);

        router.route(7, event, true);

        verify(push).send(7, event);
        verifyNoInteractions(messaging);
        assertSavedChannel("PUSH");
    }

    @Test
    void pushOnlyEventIsSilentWhileUserIsActive() {
        when(presence.isActive(7)).thenReturn(true);

        router.route(7, event(NotificationAudiencePolicy.PUSH_WHEN_INACTIVE_ONLY));

        verifyNoInteractions(messaging, push);
        assertSavedChannel("ACTIVE_UI_ONLY");
    }

    @Test
    void alreadyDeliveredEventIsNotRoutedAgain() {
        when(deliveries.existsByEventIdAndUser_Id("event-1", 7)).thenReturn(true);

        router.route(7, event(NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE));

        verifyNoInteractions(messaging, push, users);
        verify(deliveries, never()).saveAndFlush(any());
    }

    private NotificationEvent event(NotificationAudiencePolicy policy) {
        return new NotificationEvent("event-1", "TEST", "Title", "Body", "/status", policy);
    }

    private void assertSavedChannel(String expected) {
        ArgumentCaptor<NotificationDeliveryEntity> captor = ArgumentCaptor.forClass(NotificationDeliveryEntity.class);
        verify(deliveries).saveAndFlush(captor.capture());
        assertEquals(expected, captor.getValue().getChannel());
        assertEquals("event-1", captor.getValue().getEventId());
        assertEquals(7, captor.getValue().getUser().getId());
    }
}
