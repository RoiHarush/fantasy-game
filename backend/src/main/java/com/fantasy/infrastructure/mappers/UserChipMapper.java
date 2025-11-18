package com.fantasy.infrastructure.mappers;

import com.fantasy.domain.user.UserGameData;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.dto.UserChipsDto;

public class UserChipMapper {
    // === Domain -> DTO ===
    public static UserChipsDto toDto(UserGameData user) {
        UserChipsDto dto = new UserChipsDto();
        dto.setRemaining(user.getChips());
        dto.setActive(user.getActiveChips());
        return dto;
    }
}

