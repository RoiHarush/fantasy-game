package com.fantasy.domain.player;

import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.score.PlayerScoreBreakdown;

import java.util.ArrayList;
import java.util.List;

public final class PlayerMatchStatsMapper {

    private PlayerMatchStatsMapper() {}

    public static PlayerMatchStatsDto toDto(Player player,
                                            ScorablePlayerStats statsEntity,
                                            TeamEntity homeTeam,
                                            TeamEntity awayTeam,
                                            Integer homeScore,
                                            Integer awayScore,
                                            boolean captain,
                                            PlayerScoreBreakdown score) {
        PlayerMatchStatsDto dto = new PlayerMatchStatsDto();
        dto.setPlayerId(player.getId());
        dto.setGameweekId(statsEntity.getGameweek());
        dto.setPlayerName(player.getName());
        dto.setHomeTeamId(homeTeam != null ? homeTeam.getId() : -1);
        dto.setAwayTeamId(awayTeam != null ? awayTeam.getId() : -1);
        dto.setHomeTeamName(homeTeam != null ? homeTeam.getName() : "TBD");
        dto.setAwayTeamName(awayTeam != null ? awayTeam.getName() : "TBD");
        dto.setHomeScore(homeScore);
        dto.setAwayScore(awayScore);
        dto.setCaptain(captain);

        List<PlayerMatchStatsDto.StatLine> lines = new ArrayList<>();
        for (PlayerScoreBreakdown.Line line : score.lines()) {
            lines.add(new PlayerMatchStatsDto.StatLine(
                    line.label(),
                    String.valueOf(line.count()),
                    line.points(),
                    getIconPath(line.label(), player.getPosition())
            ));
        }
        lines.add(new PlayerMatchStatsDto.StatLine(
                "Total",
                "",
                score.totalPoints(),
                getIconPath("Total", player.getPosition())
        ));
        dto.setStats(lines);
        return dto;
    }

    private static String getIconPath(String statName, PlayerPosition position) {
        return switch (statName) {
            case "Minutes played" -> "/Icons/stopwatch.svg";
            case "Goals" -> "/Icons/goal.svg";
            case "Assists" -> "/Icons/assist.svg";
            case "Clean sheets" -> position == PlayerPosition.GOALKEEPER
                    ? "/Icons/gk-clean-sheets.svg"
                    : "/Icons/clean-sheets.svg";
            case "Goals conceded" -> "/Icons/goal-conceded.svg";
            case "Own goals" -> "/Icons/own-goal.svg";
            case "Yellow cards" -> "/Icons/yellow-card.svg";
            case "Red cards" -> "/Icons/red-card.svg";
            case "Penalties saved" -> "/Icons/penalty-saved.svg";
            case "Penalties missed" -> "/Icons/penalty-missed.svg";
            case "Penalties conceded" -> "/Icons/penalty-conceded.svg";
            case "Forward bonus" -> "/Icons/forward-bonus.svg";
            case "Total" -> "/Icons/total.svg";
            default -> "/Icons/ball.svg";
        };
    }
}
