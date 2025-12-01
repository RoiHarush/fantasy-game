package com.fantasy.domain.user.admin;

public record AdminUserSummaryDto(
        int userId,
        String username,
        String role,
        String fantasyTeamName,
        int totalPoints
) {
}
