package com.fantasy.scheduler;

import com.fantasy.domain.game.GameWeekEntity;
import com.fantasy.domain.league.LeagueRepository;
import com.fantasy.domain.league.LeagueStatus;
import com.fantasy.domain.notification.LeagueNotificationRequestedEvent;
import com.fantasy.domain.notification.NotificationDeliveryRepository;
import com.fantasy.domain.notification.NotificationEvents;
import com.fantasy.domain.transfer.LeagueTransferWindowEntity;
import com.fantasy.domain.transfer.LeagueTransferWindowRepository;
import com.fantasy.domain.transfer.TransferWindowType;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScheduledNotificationServiceTest {

    @Test
    void transferReminderExcludesManagersWhoChoseAutomation() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        LeagueTransferWindowRepository windows = mock(LeagueTransferWindowRepository.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        NotificationDeliveryRepository deliveries = mock(NotificationDeliveryRepository.class);
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(3);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setAutomaticForUser(8, true);

        when(leagues.findIdsByStatus(LeagueStatus.ACTIVE)).thenReturn(List.of(4L));
        when(leagues.findUserIdsByLeagueId(4L)).thenReturn(List.of(7, 8));
        when(windows.findByLeague_IdAndGameWeek_IdAndWindowType(4L, 3, TransferWindowType.TRANSFER))
                .thenReturn(Optional.of(window));

        ScheduledNotificationService service = new ScheduledNotificationService(
                leagues, windows, events, deliveries
        );
        service.transferWindowOpeningSoon(gameweek);

        ArgumentCaptor<Object> published = ArgumentCaptor.forClass(Object.class);
        verify(events).publishEvent(published.capture());
        LeagueNotificationRequestedEvent event = (LeagueNotificationRequestedEvent) published.getValue();
        assertEquals(Set.of(8), event.excludedUserIds());
    }

    @Test
    void transferReminderCompletionDoesNotWaitForExcludedManagers() {
        LeagueRepository leagues = mock(LeagueRepository.class);
        LeagueTransferWindowRepository windows = mock(LeagueTransferWindowRepository.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        NotificationDeliveryRepository deliveries = mock(NotificationDeliveryRepository.class);
        GameWeekEntity gameweek = new GameWeekEntity();
        gameweek.setId(3);
        LeagueTransferWindowEntity window = new LeagueTransferWindowEntity();
        window.setAutomaticForUser(8, true);
        String eventId = NotificationEvents.windowOpeningSoon(4L, 3).eventId();

        when(leagues.findIdsByStatus(LeagueStatus.ACTIVE)).thenReturn(List.of(4L));
        when(leagues.findUserIdsByLeagueId(4L)).thenReturn(List.of(7, 8));
        when(windows.findByLeague_IdAndGameWeek_IdAndWindowType(4L, 3, TransferWindowType.TRANSFER))
                .thenReturn(Optional.of(window));
        when(deliveries.existsByEventIdAndUser_Id(eventId, 7)).thenReturn(true);

        ScheduledNotificationService service = new ScheduledNotificationService(
                leagues, windows, events, deliveries
        );

        assertTrue(service.transferWindowOpeningSoonComplete(gameweek));
        verify(deliveries, never()).existsByEventIdAndUser_Id(eventId, 8);
    }
}
