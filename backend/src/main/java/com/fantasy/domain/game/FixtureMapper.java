package com.fantasy.domain.game;

import java.time.format.DateTimeFormatter;

public class FixtureMapper {
    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

    public static FixtureDto toDto(FixtureEntity entity) {
        return new FixtureDto(
                entity.getId(),
                entity.getGameweekId(),
                entity.getKickoffTime() == null ? null :
                        entity.getKickoffTime().toString(),
                entity.getHomeTeamId(),
                entity.getAwayTeamId(),
                entity.getHomeTeamScore(),
                entity.getAwayTeamScore(),
                entity.isStarted(),
                entity.isFinished(),
                entity.getMinutes()
        );
    }
}

