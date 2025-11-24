package com.fantasy.infrastructure.mappers;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.realWorldData.TeamEntity;
import com.fantasy.domain.score.ScoreCalculator;
import com.fantasy.domain.scoreEvent.ScoreEvent;
import com.fantasy.domain.scoreEvent.ScoreType;
import com.fantasy.dto.PlayerMatchStatsDto;
import java.util.ArrayList;
import java.util.List;

public class PlayerMatchStatsMapper {

    private static Player currentPlayer;

    public static PlayerMatchStatsDto toDto(
            Player player,
            PlayerGameweekStatsEntity e,
            TeamEntity homeTeam,
            TeamEntity awayTeam,
            Integer homeScore,
            Integer awayScore,
            boolean isCaptain) {

        currentPlayer = player;

        PlayerMatchStatsDto dto = new PlayerMatchStatsDto();

        dto.setPlayerId(player.getId());
        dto.setGameweekId(e.getGameweek());
        dto.setPlayerName(player.getName());

        dto.setHomeTeamId(homeTeam != null ? homeTeam.getId() : -1);
        dto.setAwayTeamId(awayTeam != null ? awayTeam.getId() : -1);
        dto.setHomeTeamName(homeTeam != null ? homeTeam.getName() : "TBD");
        dto.setAwayTeamName(awayTeam != null ? awayTeam.getName() : "TBD");
        dto.setHomeScore(homeScore);
        dto.setAwayScore(awayScore);
        dto.setCaptain(isCaptain);

        List<PlayerMatchStatsDto.StatLine> stats = new ArrayList<>();

        // === Minutes Played ===
        if (e.getMinutesPlayed() > 0)
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Minutes played",
                    String.valueOf(e.getMinutesPlayed()),
                    calcMinutesPts(e),
                    getIconPath("Minutes played")
            ));

        // === Goals ===
        if (e.getGoals() > 0) {
            int ptsPerGoal = ScoreCalculator.calculatePoints(
                    new ScoreEvent(player, 0, ScoreType.GOAL)
            );
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Goals",
                    String.valueOf(e.getGoals()),
                    e.getGoals() * ptsPerGoal,
                    getIconPath("Goals")
            ));

            if (player.getPosition() == PlayerPosition.FORWARD && e.getGoals() >= 2) {
                int bonusGoals = e.getGoals() - 1;
                int bonusPoints = bonusGoals;
                stats.add(new PlayerMatchStatsDto.StatLine(
                        "Forward bonus",
                        String.valueOf(bonusGoals),
                        bonusPoints,
                        getIconPath("Forward bonus")
                ));
            }
        }

        // === Assists ===
        if (e.getAssists() > 0) {
            int ptsPerAssist = ScoreCalculator.calculatePoints(
                    new ScoreEvent(player, 0, ScoreType.ASSIST)
            );
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Assists",
                    String.valueOf(e.getAssists()),
                    e.getAssists() * ptsPerAssist,
                    getIconPath("Assists")
            ));
        }

        // === Clean Sheet ===
        if (e.isCleanSheet()) {
            int cleanSheetPts = ScoreCalculator.calculatePoints(
                    new ScoreEvent(player, e.getMinutesPlayed(), ScoreType.CLEAN_SHEET)
            );
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Clean sheets",
                    "1",
                    cleanSheetPts,
                    getIconPath("Clean sheets")
            ));
        }

        // === Goals Conceded Penalty ===
        if ((player.getPosition() == PlayerPosition.GOALKEEPER || player.getPosition() == PlayerPosition.DEFENDER)
                && e.getGoalsConceded() > 2) {
            int extraConceded = e.getGoalsConceded() - 2;
            int penaltyPoints = -extraConceded;
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Goals conceded",
                    String.valueOf(extraConceded),
                    penaltyPoints,
                    getIconPath("Goals conceded")
            ));
        }

        // === Yellow Cards ===
        if (e.getYellowCards() > 0) {
            int ptsPerCard = ScoreCalculator.calculatePoints(
                    new ScoreEvent(player, 0, ScoreType.YELLOW_CARD)
            );
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Yellow cards",
                    String.valueOf(e.getYellowCards()),
                    e.getYellowCards() * ptsPerCard,
                    getIconPath("Yellow cards")
            ));
        }

        // === Own Goals ===
        if (e.getOwnGoals() > 0) {
            int ptsPerOg = ScoreCalculator.calculatePoints(
                    new ScoreEvent(player, 0, ScoreType.OWN_GOAL)
            );
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Own goals",
                    String.valueOf(e.getOwnGoals()),
                    e.getOwnGoals() * ptsPerOg,
                    getIconPath("Own goals")
            ));
        }

        // === Red Cards ===
        if (e.getRedCards() > 0) {
            int ptsPerCard = ScoreCalculator.calculatePoints(
                    new ScoreEvent(player, 0, ScoreType.RED_CARD)
            );
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Red cards",
                    String.valueOf(e.getRedCards()),
                    e.getRedCards() * ptsPerCard,
                    getIconPath("Red cards")
            ));
        }

        // === Penalties Saved ===
        if (e.getPenaltiesSaved() > 0) {
            int ptsPerSave = ScoreCalculator.calculatePoints(
                    new ScoreEvent(player, 0, ScoreType.PENALTY_SAVE)
            );
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Penalties saved",
                    String.valueOf(e.getPenaltiesSaved()),
                    e.getPenaltiesSaved() * ptsPerSave,
                    getIconPath("Penalties saved")
            ));
        }

        // === Penalties Missed ===
        if (e.getPenaltiesMissed() > 0) {
            int ptsPerMiss = ScoreCalculator.calculatePoints(
                    new ScoreEvent(player, 0, ScoreType.PENALTY_MISS)
            );
            stats.add(new PlayerMatchStatsDto.StatLine(
                    "Penalties missed",
                    String.valueOf(e.getPenaltiesMissed()),
                    e.getPenaltiesMissed() * ptsPerMiss,
                    getIconPath("Penalties missed")
            ));
        }

        // === Total ===
        stats.add(new PlayerMatchStatsDto.StatLine(
                "Total",
                "",
                e.getTotalPoints(),
                getIconPath("Total")
        ));

        dto.setStats(stats);
        return dto;
    }

    private static int calcMinutesPts(PlayerGameweekStatsEntity e) {
        if (e.isStarted()) return 2;
        if (!e.isStarted() && e.getMinutesPlayed() > 0) return 1;
        return 0;
    }


    private static String getIconPath(String statName) {
        switch (statName) {
            case "Minutes played": return "/Icons/stopwatch.svg";
            case "Goals": return "/Icons/goal.svg";
            case "Assists": return "/Icons/assist.svg";
            case "Clean sheets":
                if (currentPlayer != null && currentPlayer.getPosition() == PlayerPosition.GOALKEEPER)
                    return "/Icons/gk-clean-sheets.svg";
                else
                    return "/Icons/clean-sheets.svg";
            case "Goals conceded": return "/Icons/goal-conceded.svg";
            case "Own goals": return "/Icons/own-goal.svg";
            case "Yellow cards": return "/Icons/yellow-card.svg";
            case "Red cards": return "/Icons/red-card.svg";
            case "Penalties saved": return "/Icons/penalty-saved.svg";
            case "Penalties missed": return "/Icons/penalty-missed.svg";
            case "Forward bonus": return "/Icons/forward-bonus.svg";
            case "Total": return "/Icons/total.svg";
            case "Captain bonus": return "/Icons/captain.svg";
            default: return "/Icons/ball.svg";
        }
    }
}
