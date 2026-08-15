package com.fantasy.config;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class WebSocketPresenceServiceTest {

    @Test
    void userIsActiveWhenAtLeastOneConnectionIsVisible() {
        WebSocketPresenceService presence = new WebSocketPresenceService(mock(ApplicationEventPublisher.class));

        presence.report("desktop", 7, false, "desktop-browser", "/status");
        presence.report("phone", 7, true, "iphone-pwa", "/transfers");

        assertTrue(presence.isOnline(7));
        assertTrue(presence.isActive(7));
        assertTrue(presence.onlineUserIds(List.of(7, 8)).contains(7));
        assertTrue(presence.activeUserIds(List.of(7, 8)).contains(7));
    }

    @Test
    void connectedButHiddenClientsAreOnlineAndNotActive() {
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        WebSocketPresenceService presence = new WebSocketPresenceService(publisher);

        presence.report("desktop", 7, false, "desktop-browser", "/status");
        presence.report("phone", 7, false, "iphone-pwa", "/transfers");

        assertTrue(presence.isOnline(7));
        assertFalse(presence.isActive(7));
        assertFalse(presence.activeUserIds(List.of(7, 8)).contains(7));
        verify(publisher).publishEvent(new UserPresenceChangedEvent(7, true, false));
    }

    @Test
    void explicitDisconnectRemovesOnlyTheCallingConnection() {
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        WebSocketPresenceService presence = new WebSocketPresenceService(publisher);
        presence.report("desktop", 7, true, "desktop-browser", "/transfers");
        presence.report("phone", 7, false, "iphone-pwa", "/transfers");

        presence.disconnect("desktop", 7);

        assertTrue(presence.isOnline(7));
        assertFalse(presence.isActive(7));

        presence.disconnect("phone", 7);

        assertFalse(presence.isOnline(7));
    }

    @Test
    void explicitDisconnectCannotRemoveAnotherUsersSession() {
        WebSocketPresenceService presence = new WebSocketPresenceService(mock(ApplicationEventPublisher.class));
        presence.report("desktop", 7, true, "desktop-browser", "/transfers");

        presence.disconnect("desktop", 8);

        assertTrue(presence.isOnline(7));
        assertTrue(presence.isActive(7));
    }
}
