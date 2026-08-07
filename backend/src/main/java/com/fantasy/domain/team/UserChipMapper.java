package com.fantasy.domain.team;

import java.util.HashMap;

public class UserChipMapper {
    // === Domain -> DTO ===
    public static UserChipsDto toDto(UserGameData user) {
        UserChipsDto dto = new UserChipsDto();
        dto.setRemaining(new HashMap<>(user.getChips()));
        dto.setActive(new HashMap<>(user.getActiveChips()));
        return dto;
    }
}

