package com.fantasy.domain.live;

import java.time.LocalDateTime;
import java.util.List;

public record LeagueLiveDto(
        Integer gameweekId,
        String gameweekName,
        List<LiveFixture> fixtures,
        UpcomingFixture nextFixture,
        int ownedPlayerCount,
        LocalDateTime refreshedAt
) {
    public record LiveFixture(
            int id,
            int homeTeamId,
            int awayTeamId,
            Integer homeScore,
            Integer awayScore,
            int minutes,
            LocalDateTime kickoffTime,
            List<LivePlayer> players
    ) {}

    public record UpcomingFixture(
            int id,
            int gameweekId,
            int homeTeamId,
            int awayTeamId,
            LocalDateTime kickoffTime
    ) {}

    public record LivePlayer(
            int playerId,
            String viewName,
            String position,
            int teamId,
            String photo,
            int ownerUserId,
            String ownerName,
            String ownerTeamName,
            String squadRole,
            boolean captain,
            int multiplier,
            int minutesPlayed,
            String participation,
            int points,
            int contributionPoints,
            int goals,
            int assists,
            int yellowCards,
            int redCards
    ) {}
}
