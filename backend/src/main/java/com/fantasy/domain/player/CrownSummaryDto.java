package com.fantasy.domain.player;

import java.util.List;

public record CrownSummaryDto(
        List<PlayerOfTheWeekDto> playersOfTheWeek,
        List<CrownStandingDto> crownStandings
) {}
