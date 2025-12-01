package com.fantasy.domain.game;

public class GameWeekMapper {

    public static GameWeekDto toDto(GameWeekEntity entity) {
        return new GameWeekDto(
                entity.getId(),
                entity.getName(),
                entity.getFirstKickoffTime(),
                entity.getLastKickoffTime(),
                entity.getStatus(),
                entity.getTransferOpenTime(),
                entity.isCalculated(),
                entity.isTransferWindowProcessed()
        );
    }
}

