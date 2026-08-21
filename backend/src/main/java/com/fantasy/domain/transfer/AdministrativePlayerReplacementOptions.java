package com.fantasy.domain.transfer;

import java.util.List;

public record AdministrativePlayerReplacementOptions(
        long leagueId,
        int userId,
        String managerName,
        String fantasyTeamName,
        Integer gameweekId,
        boolean allowed,
        List<String> blockingReasons,
        List<PlayerOption> rosterPlayers,
        List<PlayerOption> availablePlayers
) {
    public record PlayerOption(
            int id,
            String viewName,
            String position,
            Integer teamId,
            int points,
            boolean injured,
            String news,
            String photo,
            boolean captain,
            boolean viceCaptain,
            boolean firstPick
    ) {
    }
}
