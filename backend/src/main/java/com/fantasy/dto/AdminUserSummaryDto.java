package com.fantasy.dto;

public record AdminUserSummaryDto(
        int userId,
        String username,
        String role,
        String fantasyTeamName,
        int totalPoints
) {
}
