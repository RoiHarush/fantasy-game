package com.fantasy.config;

public record UserPresenceChangedEvent(
        int userId,
        boolean online,
        boolean active
) {}
