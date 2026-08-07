package com.fantasy.domain.realWorldData;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

class TeamServiceTest {

    @Test
    void keepsInternalCodeEqualToIdAndStoresFplCodeForAssets() throws Exception {
        TeamService service = new TeamService(
                mock(TeamRepository.class),
                new ObjectMapper(),
                mock(RestTemplate.class)
        );

        var root = new ObjectMapper().readTree("""
                {
                  "teams": [
                    {"id": 1, "name": "Arsenal", "short_name": "ARS", "code": 3}
                  ]
                }
                """);

        TeamEntity arsenal = service.parseTeams(root).getFirst();

        assertEquals(1, arsenal.getId());
        assertEquals(1, arsenal.getCode());
        assertEquals(3, arsenal.getAssetCode());

        TeamDto dto = service.toDto(arsenal);
        assertEquals("https://resources.premierleague.com/premierleague/badges/100/t3.png", dto.badgeUrl());
        assertEquals("https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_3-66.png", dto.fieldKitUrl());
        assertEquals("https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_3_1-66.png", dto.goalkeeperKitUrl());
    }
}
