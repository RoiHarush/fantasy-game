package com.fantasy.domain.game;

import java.time.LocalDate;

public record GameweekDailyStatusDto(
        LocalDate date,
        boolean isCalculated,
        boolean isToday
) {}
