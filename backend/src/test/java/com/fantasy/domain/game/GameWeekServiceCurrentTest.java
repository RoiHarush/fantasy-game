package com.fantasy.domain.game;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GameWeekServiceCurrentTest {

    @Test
    void preseasonHasNoCurrentGameweek() {
        GameWeekRepository gameWeekRepository = mock(GameWeekRepository.class);
        GameWeekEntity upcoming = new GameWeekEntity();
        upcoming.setId(1);
        upcoming.setStatus("UPCOMING");

        when(gameWeekRepository.findAll()).thenReturn(List.of(upcoming));
        when(gameWeekRepository.findFirstByStatusOrderByIdDesc("FINISHED"))
                .thenReturn(Optional.empty());

        GameWeekService service = new GameWeekService(
                gameWeekRepository,
                mock(FixtureRepository.class),
                mock(GameweekDailyStatusRepository.class),
                new ObjectMapper(),
                mock(RestTemplate.class)
        );

        assertNull(service.getCurrentGameweek());
    }

    @Test
    void changedFplKickoffPublishesLifecycleRescheduleEvent() {
        GameWeekRepository gameWeekRepository = mock(GameWeekRepository.class);
        FixtureRepository fixtureRepository = mock(FixtureRepository.class);
        GameWeekEntity upcoming = new GameWeekEntity();
        upcoming.setId(1);
        upcoming.setStatus("UPCOMING");
        upcoming.setFirstKickoffTime(LocalDateTime.of(2026, 8, 20, 20, 0));
        upcoming.setLastKickoffTime(LocalDateTime.of(2026, 8, 20, 22, 0));
        FixtureEntity movedFixture = new FixtureEntity();
        movedFixture.setId(10);
        movedFixture.setGameweekId(1);
        movedFixture.setKickoffTime(LocalDateTime.of(2026, 8, 21, 20, 0));
        when(gameWeekRepository.findAll()).thenReturn(List.of(upcoming));
        when(fixtureRepository.findByGameweekId(1)).thenReturn(List.of(movedFixture));
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        GameWeekService service = new GameWeekService(
                gameWeekRepository,
                fixtureRepository,
                mock(GameweekDailyStatusRepository.class),
                new ObjectMapper(),
                mock(RestTemplate.class)
        );
        service.setLifecycleEvents(events);

        service.updateGameWeekDeadlines();

        verify(gameWeekRepository).saveAll(List.of(upcoming));
        verify(events).publishEvent(any(com.fantasy.scheduler.LifecycleScheduleChangedEvent.class));
    }
}
