package com.fantasy.domain.notification;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationEventsTest {

    @Test
    void onlyTheApprovedFiveEventsCanBecomeInAppToasts() {
        var toastOrPush = List.of(
                NotificationEvents.windowOpeningSoon(7, 4),
                NotificationEvents.lineupLockSoon(7, 4),
                NotificationEvents.windowOpened(12, 4),
                NotificationEvents.irActivated(2, 4, 30, "Roi", "Player"),
                NotificationEvents.irReleased(2, 4, 30, "Roi", "Player")
        );

        assertThat(toastOrPush)
                .extracting(NotificationEvent::policy)
                .containsOnly(NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE);
    }

    @Test
    void backgroundOnlyEventsNeverCreateAnInAppToast() {
        var pushOnly = List.of(
                NotificationEvents.turnCompleted(12, "REGULAR", 3, "Roi completed a turn."),
                NotificationEvents.yourTurn(12, "REGULAR", 4),
                NotificationEvents.matchdayClosed(4, "2026-08-14"),
                NotificationEvents.gameweekFinalized(4)
        );

        assertThat(pushOnly)
                .extracting(NotificationEvent::policy)
                .containsOnly(NotificationAudiencePolicy.PUSH_WHEN_INACTIVE_ONLY);
    }

    @Test
    void repeatedBusinessEventsKeepStableDeduplicationIds() {
        assertThat(NotificationEvents.windowOpened(12, 4).eventId())
                .isEqualTo(NotificationEvents.windowOpened(12, 4).eventId());
        assertThat(NotificationEvents.yourTurn(12, "IR", 1).eventId())
                .isNotEqualTo(NotificationEvents.yourTurn(12, "IR", 2).eventId());
    }
}
