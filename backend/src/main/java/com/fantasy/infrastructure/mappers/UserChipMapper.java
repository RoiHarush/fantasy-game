package com.fantasy.infrastructure.mappers;

import com.fantasy.domain.user.User;
import com.fantasy.domain.user.UserEntity;
import com.fantasy.dto.UserChipsDto;

public class UserChipMapper {
    // === Domain -> DTO ===
    public static UserChipsDto toDto(User user) {
        UserChipsDto dto = new UserChipsDto();
        dto.setRemaining(user.getChips());
        dto.setActive(user.getActiveChips());
        return dto;
    }

    // === Entity -> DTO ===
    public static UserChipsDto toDto(UserEntity userEntity) {
        UserChipsDto dto = new UserChipsDto();
        dto.setRemaining(userEntity.getChips());
        dto.setActive(userEntity.getActiveChips());
        return dto;
    }
}

