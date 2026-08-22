package com.fantasy.domain.game;

import com.fantasy.domain.realWorldData.TeamRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FixtureServicePostponementTest {

    @Test
    void treatsFplProvisionalFinishAsCompleteForSafeSettlement() {
        FixtureRepository fixtureRepository = mock(FixtureRepository.class);
        RestTemplate restTemplate = mock(RestTemplate.class);
        FixtureEntity fixture = new FixtureEntity(
                1,
                1,
                1,
                7,
                LocalDateTime.of(2026, 8, 21, 22, 0),
                3,
                0
        );
        when(fixtureRepository.findByGameweekId(1)).thenReturn(List.of(fixture));
        when(restTemplate.getForObject(
                "https://fantasy.premierleague.com/api/fixtures/",
                String.class
        )).thenReturn("""
                [{
                  "id": 1,
                  "event": 1,
                  "team_h_score": 3,
                  "team_a_score": 0,
                  "started": true,
                  "finished": false,
                  "finished_provisional": true,
                  "minutes": 90,
                  "kickoff_time": "2026-08-21T19:00:00Z"
                }]
                """);

        FixtureService service = new FixtureService(
                fixtureRepository,
                mock(TeamRepository.class),
                restTemplate,
                new ObjectMapper(),
                mock(FixturePersistenceService.class)
        );

        service.updateFixturesForGameweek(1);

        assertTrue(fixture.isFinished());
        verify(fixtureRepository).saveAll(anyList());
    }

    @Test
    void removesPostponedFixtureFromItsOldGameweekWhenFplClearsTheEvent() {
        FixtureRepository fixtureRepository = mock(FixtureRepository.class);
        RestTemplate restTemplate = mock(RestTemplate.class);
        FixtureEntity fixture = new FixtureEntity(
                91,
                4,
                1,
                2,
                LocalDateTime.of(2026, 9, 12, 17, 0),
                null,
                null
        );
        when(fixtureRepository.findByGameweekId(4)).thenReturn(List.of(fixture));
        when(restTemplate.getForObject(
                "https://fantasy.premierleague.com/api/fixtures/",
                String.class
        )).thenReturn("""
                [{
                  "id": 91,
                  "event": null,
                  "team_h_score": null,
                  "team_a_score": null,
                  "started": false,
                  "finished": false,
                  "minutes": 0,
                  "kickoff_time": null
                }]
                """);

        FixtureService service = new FixtureService(
                fixtureRepository,
                mock(TeamRepository.class),
                restTemplate,
                new ObjectMapper(),
                mock(FixturePersistenceService.class)
        );

        service.updateFixturesForGameweek(4);

        assertEquals(0, fixture.getGameweekId());
        assertNull(fixture.getKickoffTime());
        verify(fixtureRepository).saveAll(anyList());
    }
}
