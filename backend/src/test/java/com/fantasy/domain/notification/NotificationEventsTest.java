package com.fantasy.domain.notification;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationEventsTest {

    @Test
    void draftReminderNamesTheDraftAndExactLeadTime() {
        NotificationEvent initial = NotificationEvents.draftOpeningSoon(5L, 9L, 1_800_000_000L, false);
        NotificationEvent supplemental = NotificationEvents.draftOpeningSoon(5L, 10L, 1_800_003_600L, true);

        assertEquals("Initial draft starts in 10 minutes", initial.title());
        assertEquals("Mid-season draft starts in 10 minutes", supplemental.title());
        assertEquals("/draft-room", initial.url());
        assertEquals(NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE, initial.policy());
        assertTrue(initial.eventId().contains("draft:9:at:1800000000:opening-10m"));
    }

    @Test
    void actionableDraftNotificationsUseDraftRoomInsteadOfTransferWindow() {
        NotificationEvent opened = NotificationEvents.draftOpened(21L, 1, false);
        NotificationEvent turn = NotificationEvents.yourDraftTurn(21L, "REGULAR", 2, false);

        assertEquals("/draft-room", opened.url());
        assertEquals("/draft-room", turn.url());
        assertEquals("INITIAL_DRAFT_OPENED", opened.type());
        assertEquals("YOUR_INITIAL_DRAFT_TURN", turn.type());
    }
}
