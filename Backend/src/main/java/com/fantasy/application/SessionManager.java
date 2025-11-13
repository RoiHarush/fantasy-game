package com.fantasy.application;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SessionManager {

    private final Map<String, Integer> activeSessions = new ConcurrentHashMap<>();

    public String createSession(int userId) {
        String token = UUID.randomUUID().toString();
        activeSessions.put(token, userId);
        return token;
    }

    public Integer getUserId(String token) {
        return activeSessions.get(token);
    }

    public void removeSession(String token) {
        activeSessions.remove(token);
    }
}
