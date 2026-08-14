package com.fantasy.config;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class WebSocketPresenceService {

    private final Map<String, Integer> sessionUsers = new ConcurrentHashMap<>();
    private final Map<Integer, AtomicInteger> userSessionCounts = new ConcurrentHashMap<>();
    private final Map<Integer, LocalDateTime> lastDisconnectedAt = new ConcurrentHashMap<>();
    private final LocalDateTime serviceStartedAt = LocalDateTime.now();

    @EventListener
    public void connected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = accessor.getUser();
        String sessionId = accessor.getSessionId();
        if (principal == null || sessionId == null) return;

        int userId = Integer.parseInt(principal.getName());
        Integer previousUser = sessionUsers.putIfAbsent(sessionId, userId);
        if (previousUser == null) {
            userSessionCounts.computeIfAbsent(userId, ignored -> new AtomicInteger()).incrementAndGet();
            lastDisconnectedAt.remove(userId);
        }
    }

    @EventListener
    public void disconnected(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        Integer userId = sessionUsers.remove(sessionId);
        if (userId == null) return;

        userSessionCounts.computeIfPresent(userId, (ignored, count) ->
                count.decrementAndGet() <= 0 ? null : count
        );
        if (!isOnline(userId)) {
            lastDisconnectedAt.put(userId, LocalDateTime.now());
        }
    }

    public boolean isOnline(int userId) {
        AtomicInteger count = userSessionCounts.get(userId);
        return count != null && count.get() > 0;
    }

    public Optional<LocalDateTime> offlineSince(int userId) {
        if (isOnline(userId)) return Optional.empty();
        return Optional.of(lastDisconnectedAt.getOrDefault(userId, serviceStartedAt));
    }

    public List<Integer> onlineUserIds(Collection<Integer> userIds) {
        return userIds.stream().filter(this::isOnline).toList();
    }
}
