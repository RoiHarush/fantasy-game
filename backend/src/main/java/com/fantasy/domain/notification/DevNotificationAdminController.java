package com.fantasy.domain.notification;

import com.fantasy.domain.user.UserRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@Profile("dev")
@RequestMapping("/api/admin/dev/notifications")
@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN')")
public class DevNotificationAdminController {
    private final UserRepository userRepository;
    private final NotificationRouter notificationRouter;
    private final WebPushSender webPushSender;

    public DevNotificationAdminController(UserRepository userRepository,
                                          NotificationRouter notificationRouter,
                                          WebPushSender webPushSender) {
        this.userRepository = userRepository;
        this.notificationRouter = notificationRouter;
        this.webPushSender = webPushSender;
    }

    @PostMapping("/test")
    public Map<String, Object> sendTestNotification(
            @RequestParam(defaultValue = "route") String mode
    ) {
        List<Integer> userIds = userRepository.findAll().stream()
                .map(user -> user.getId())
                .toList();
        NotificationEvent event = new NotificationEvent(
                "dev-test:" + Instant.now().toEpochMilli() + ":" + UUID.randomUUID(),
                "DEV_TEST",
                "Fantasy Draft test",
                "If you can see this, notification delivery is working.",
                "/status",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );

        if ("push".equalsIgnoreCase(mode)) {
            long deliveredUsers = userIds.stream()
                    .filter(userId -> webPushSender.send(userId, event))
                    .count();
            return Map.of(
                    "mode", "FORCED_PUSH",
                    "recipients", userIds.size(),
                    "deliveredUsers", deliveredUsers
            );
        }

        if (!"route".equalsIgnoreCase(mode)) {
            throw new IllegalArgumentException("Notification test mode must be 'route' or 'push'");
        }
        notificationRouter.route(userIds, event);
        return Map.of(
                "mode", "NORMAL_ROUTING",
                "recipients", userIds.size()
        );
    }
}
