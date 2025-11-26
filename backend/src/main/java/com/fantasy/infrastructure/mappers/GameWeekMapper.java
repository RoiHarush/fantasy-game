package com.fantasy.infrastructure.mappers;

import com.fantasy.dto.GameWeekDto;
import com.fantasy.domain.game.GameWeekEntity;

public class GameWeekMapper {

    public static GameWeekDto toDto(GameWeekEntity entity) {
        return new GameWeekDto(
                entity.getId(),
                entity.getName(),
                entity.getFirstKickoffTime(),
                entity.getLastKickoffTime(),
                entity.getStatus(),
                entity.getTransferOpenTime(),
                entity.isCalculated()
        );
    }
}

