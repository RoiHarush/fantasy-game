package com.fantasy.domain.transfer;

public record AdministrativePlayerReplacementResult(
        long leagueId,
        int userId,
        int gameweekId,
        int playerOutId,
        String playerOutName,
        int playerInId,
        String playerInName,
        String message
) {
}
