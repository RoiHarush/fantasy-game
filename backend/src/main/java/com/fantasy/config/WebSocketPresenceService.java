package com.fantasy.config;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WebSocketPresenceService {

    private static final Duration ACTIVE_REPORT_TTL = Duration.ofSeconds(35);

    private final Map<String, ConnectionPresence> connections = new ConcurrentHashMap<>();
    private final Map<Integer, LocalDateTime> lastDisconnectedAt = new ConcurrentHashMap<>();
    private final LocalDateTime serviceStartedAt = LocalDateTime.now();

    @EventListener
    public void connected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        String sessionId = accessor.getSessionId();
        if (principal == null || sessionId == null) return;

        int userId = Integer.parseInt(principal.getName());
        // A transport connection is online, but not considered visibly active
        // until the browser sends its first application-level presence report.
        connections.put(sessionId, new ConnectionPresence(userId, false, null, null, Instant.now()));
        lastDisconnectedAt.remove(userId);
    }

    @EventListener
    public void disconnected(SessionDisconnectEvent event) {
        ConnectionPresence removed = connections.remove(event.getSessionId());
        if (removed != null && !isOnline(removed.userId())) {
            lastDisconnectedAt.put(removed.userId(), LocalDateTime.now());
        }
    }

    public void report(String sessionId, int userId, boolean visible, String clientInstanceId, String page) {
        if (sessionId == null) return;
        connections.compute(sessionId, (ignored, current) -> {
            if (current != null && current.userId() != userId) {
                return current;
            }
            return new ConnectionPresence(userId, visible, trim(clientInstanceId, 128), trim(page, 256), Instant.now());
        });
        lastDisconnectedAt.remove(userId);
    }

    public boolean isActive(int userId) {
        Instant cutoff = Instant.now().minus(ACTIVE_REPORT_TTL);
        return connections.values().stream()
                .anyMatch(connection -> connection.userId() == userId
                        && connection.visible()
                        && connection.lastReportedAt().isAfter(cutoff));
    }

    public boolean isOnline(int userId) {
        return connections.values().stream().anyMatch(connection -> connection.userId() == userId);
    }

    public Optional<LocalDateTime> offlineSince(int userId) {
        if (isOnline(userId)) return Optional.empty();
        return Optional.of(lastDisconnectedAt.getOrDefault(userId, serviceStartedAt));
    }

    public List<Integer> onlineUserIds(Collection<Integer> userIds) {
        return userIds.stream().filter(this::isOnline).toList();
    }

    private String trim(String value, int maxLength) {
        if (value == null || value.isBlank()) return null;
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    record ConnectionPresence(
            int userId,
            boolean visible,
            String clientInstanceId,
            String page,
            Instant lastReportedAt
    ) {}
}
