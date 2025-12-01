package com.fantasy.domain.team;

public class UserChipMapper {
    // === Domain -> DTO ===
    public static UserChipsDto toDto(UserGameData user) {
        UserChipsDto dto = new UserChipsDto();
        dto.setRemaining(user.getChips());
        dto.setActive(user.getActiveChips());
        return dto;
    }
}

