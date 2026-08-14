package com.fantasy.domain.notification;

import com.fantasy.domain.user.UserEntity;
import com.fantasy.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DevNotificationAdminControllerTest {
    private final UserRepository userRepository = mock(UserRepository.class);
    private final NotificationRouter notificationRouter = mock(NotificationRouter.class);
    private final WebPushSender webPushSender = mock(WebPushSender.class);
    private final DevNotificationAdminController controller = new DevNotificationAdminController(
            userRepository,
            notificationRouter,
            webPushSender
    );

    @Test
    void normalModeExercisesTheRealPresenceAwareRouterForEveryUser() {
        when(userRepository.findAll()).thenReturn(List.of(user(1), user(2)));

        Map<String, Object> result = controller.sendTestNotification("route");

        ArgumentCaptor<NotificationEvent> event = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(notificationRouter).route(eq(List.of(1, 2)), event.capture());
        verify(webPushSender, never()).send(anyInt(), any(NotificationEvent.class));
        assertEquals(NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE, event.getValue().policy());
        assertEquals("NORMAL_ROUTING", result.get("mode"));
        assertEquals(2, result.get("recipients"));
    }

    @Test
    void pushModeBypassesPresenceOnlyForDevelopmentDeliveryTesting() {
        when(userRepository.findAll()).thenReturn(List.of(user(1), user(2)));
        when(webPushSender.send(anyInt(), any(NotificationEvent.class))).thenReturn(true, false);

        Map<String, Object> result = controller.sendTestNotification("push");

        verify(notificationRouter, never()).route(anyInt(), any(NotificationEvent.class));
        assertEquals("FORCED_PUSH", result.get("mode"));
        assertEquals(2, result.get("recipients"));
        assertEquals(1L, result.get("deliveredUsers"));
    }

    private UserEntity user(int id) {
        UserEntity user = new UserEntity();
        user.setId(id);
        return user;
    }
}
