package com.fantasy.domain.notification;

import com.fantasy.domain.league.LeagueRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LeagueNotificationEventHandlerTest {

    @Test
    void marksOnlyTheSourceManagerForActiveToastSuppression() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        NotificationRouter router = mock(NotificationRouter.class);
        NotificationEvent notification = new NotificationEvent(
                "event-1",
                "IR_ACTIVATED",
                "IR activated",
                "Manager moved a player into IR.",
                "/status",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
        when(leagues.findUserIdsByLeagueId(4L)).thenReturn(List.of(7, 8));

        new LeagueNotificationEventHandler(leagues, router).handle(
                LeagueNotificationRequestedEvent.leagueFrom(4L, 7, notification)
        );

        verify(router).route(7, notification, true);
        verify(router).route(8, notification, false);
    }

    @Test
    void skipsManagersExcludedFromTheWindowNotification() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        NotificationRouter router = mock(NotificationRouter.class);
        NotificationEvent notification = new NotificationEvent(
                "event-2",
                "TRANSFER_WINDOW_OPENED",
                "Transfer window opened",
                "The transfer window is now open.",
                "/transfer-window",
                NotificationAudiencePolicy.TOAST_WHEN_ACTIVE_PUSH_WHEN_INACTIVE
        );
        when(leagues.findUserIdsByLeagueId(4L)).thenReturn(List.of(7, 8, 9));

        new LeagueNotificationEventHandler(leagues, router).handle(
                LeagueNotificationRequestedEvent.leagueExcluding(4L, Set.of(8), notification)
        );

        verify(router).route(7, notification, false);
        verify(router, never()).route(8, notification, false);
        verify(router).route(9, notification, false);
    }
}
