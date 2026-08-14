package com.fantasy.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WebSocketPresenceServiceTest {

    @Test
    void userIsActiveWhenAtLeastOneConnectionIsVisible() {
        WebSocketPresenceService presence = new WebSocketPresenceService();

        presence.report("desktop", 7, false, "desktop-browser", "/status");
        presence.report("phone", 7, true, "iphone-pwa", "/transfers");

        assertTrue(presence.isOnline(7));
        assertTrue(presence.isActive(7));
        assertTrue(presence.onlineUserIds(List.of(7, 8)).contains(7));
    }

    @Test
    void connectedButHiddenClientsAreOnlineAndNotActive() {
        WebSocketPresenceService presence = new WebSocketPresenceService();

        presence.report("desktop", 7, false, "desktop-browser", "/status");
        presence.report("phone", 7, false, "iphone-pwa", "/transfers");

        assertTrue(presence.isOnline(7));
        assertFalse(presence.isActive(7));
    }
}
