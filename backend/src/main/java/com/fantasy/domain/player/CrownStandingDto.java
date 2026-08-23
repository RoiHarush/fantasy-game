package com.fantasy.domain.player;

import java.util.List;

public record CrownStandingDto(
        int managerId,
        String managerName,
        String fantasyTeamName,
        String logoPath,
        int crownCount,
        List<PlayerOfTheWeekDto> crowns
) {}
