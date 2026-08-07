package com.fantasy.domain.game;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
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
}
