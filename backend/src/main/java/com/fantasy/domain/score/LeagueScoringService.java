package com.fantasy.domain.score;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueScoringRules;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerFixtureStatsEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.ScorablePlayerStats;
import com.fantasy.domain.team.UserSquadEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class LeagueScoringService {

    public int calculateSquadPoints(LeagueEntity league,
                                    UserSquadEntity squad,
                                    Map<Integer, PlayerGameweekStatsEntity> statsByPlayer) {
        return calculateSquadPoints(league, squad, statsByPlayer, Map.of());
    }

    public int calculateSquadPoints(LeagueEntity league,
                                    UserSquadEntity squad,
                                    Map<Integer, PlayerGameweekStatsEntity> statsByPlayer,
                                    Map<Integer, List<PlayerFixtureStatsEntity>> fixtureStatsByPlayer) {
        int total = 0;
        for (Integer playerId : squad.getStartingLineup()) {
            if (playerId == null) continue;
            PlayerGameweekStatsEntity stats = statsByPlayer.get(playerId);
            if (stats == null) continue;
            int playerPoints = calculatePlayerGameweekPoints(
                    stats,
                    fixtureStatsByPlayer.getOrDefault(playerId, List.of()),
                    league
            );
            int captainMultiplier = squad.isTripleCaptainActive() ? 3 : 2;
            total += Objects.equals(squad.getCaptainId(), playerId)
                    ? playerPoints * captainMultiplier
                    : playerPoints;
        }

        if (squad.isBenchBoostActive()) {
            for (Integer playerId : squad.getBenchMap().values()) {
                if (playerId == null) continue;
                PlayerGameweekStatsEntity stats = statsByPlayer.get(playerId);
                if (stats != null) {
                    total += calculatePlayerGameweekPoints(
                            stats,
                            fixtureStatsByPlayer.getOrDefault(playerId, List.of()),
                            league
                    );
                }
            }
        }
        return total;
    }

    public int calculatePlayerPoints(ScorablePlayerStats stats, LeagueEntity league) {
        return calculatePlayerScore(stats, league).totalPoints();
    }

    public PlayerScoreBreakdown calculatePlayerScore(ScorablePlayerStats stats,
                                                     LeagueEntity league) {
        return calculatePlayerScore(stats, league, true);
    }

    public PlayerScoreBreakdown calculateFixturePlayerScore(ScorablePlayerStats stats,
                                                            LeagueEntity league) {
        return calculatePlayerScore(stats, league, false);
    }

    public int calculatePlayerGameweekPoints(PlayerGameweekStatsEntity aggregateStats,
                                             List<PlayerFixtureStatsEntity> fixtureStats,
                                             LeagueEntity league) {
        return calculatePlayerGameweekScore(aggregateStats, fixtureStats, league).totalPoints();
    }

    public PlayerScoreBreakdown calculatePlayerGameweekScore(PlayerGameweekStatsEntity aggregateStats,
                                                             List<PlayerFixtureStatsEntity> fixtureStats,
                                                             LeagueEntity league) {
        if (fixtureStats == null || fixtureStats.isEmpty()) {
            return calculatePlayerScore(aggregateStats, league);
        }

        Map<String, int[]> totalsByLabel = new LinkedHashMap<>();
        calculatePlayerGameweekFixtureScores(aggregateStats, fixtureStats, league).stream()
                .flatMap(score -> score.lines().stream())
                .forEach(line -> {
                    int[] totals = totalsByLabel.computeIfAbsent(line.label(), ignored -> new int[2]);
                    totals[0] += line.count();
                    totals[1] += line.points();
                });

        List<PlayerScoreBreakdown.Line> lines = new ArrayList<>();
        totalsByLabel.forEach((label, totals) -> lines.add(
                new PlayerScoreBreakdown.Line(label, totals[0], totals[1])
        ));
        int total = lines.stream().mapToInt(PlayerScoreBreakdown.Line::points).sum();
        return new PlayerScoreBreakdown(total, lines);
    }

    public List<PlayerScoreBreakdown> calculatePlayerGameweekFixtureScores(
            PlayerGameweekStatsEntity aggregateStats,
            List<PlayerFixtureStatsEntity> fixtureStats,
            LeagueEntity league) {
        if (fixtureStats == null || fixtureStats.isEmpty()) return List.of();

        List<PlayerScoreBreakdown> scores = fixtureStats.stream()
                .map(stats -> calculateFixturePlayerScore(stats, league))
                .toList();
        if (league == null) return scores;

        Map<String, Integer> rules = effectiveRules(league);
        PlayerPosition position = league.effectivePosition(aggregateStats.getPlayer());
        int assistAdjustment = league.effectiveAssists(
                aggregateStats.getPlayer().getId(),
                aggregateStats.getGameweek(),
                aggregateStats.getAssists()
        ) - aggregateStats.getAssists();
        int penaltyAdjustment = league.effectivePenaltiesConceded(
                aggregateStats.getPlayer().getId(),
                aggregateStats.getGameweek(),
                aggregateStats.getPenaltiesConceded()
        ) - aggregateStats.getPenaltiesConceded();

        scores = adjustFixtureLineCount(
                scores,
                "Assists",
                assistAdjustment,
                rule(rules, "ASSIST", position)
        );
        return adjustFixtureLineCount(
                scores,
                "Penalties conceded",
                penaltyAdjustment,
                rule(rules, "PENALTY_CONCEDED", position)
        );
    }

    private PlayerScoreBreakdown calculatePlayerScore(ScorablePlayerStats stats,
                                                      LeagueEntity league,
                                                      boolean applyGameweekCorrections) {
        Objects.requireNonNull(stats, "Player stats are required");
        Objects.requireNonNull(stats.getPlayer(), "Player stats must reference a player");

        Map<String, Integer> rules = effectiveRules(league);
        PlayerPosition position = league == null
                ? stats.getPlayer().getPosition()
                : league.effectivePosition(stats.getPlayer());
        List<PlayerScoreBreakdown.Line> lines = new ArrayList<>();

        if (stats.getMinutesPlayed() > 0) {
            addLine(
                    lines,
                    "Minutes played",
                    stats.getMinutesPlayed(),
                    rule(rules, stats.isStarted() ? "PLAYED" : "FROM_BENCH", position)
            );
        }

        addCountedLine(lines, "Goals", stats.getGoals(), rule(rules, "GOAL", position));
        if (position == PlayerPosition.FORWARD && stats.getGoals() > 1) {
            addCountedLine(
                    lines,
                    "Forward bonus",
                    stats.getGoals() - 1,
                    rule(rules, "SECOND_GOAL_BONUS", position)
            );
        }

        int assists = league == null || !applyGameweekCorrections
                ? stats.getAssists()
                : league.effectiveAssists(stats.getPlayer().getId(), stats.getGameweek(), stats.getAssists());
        addCountedLine(lines, "Assists", assists, rule(rules, "ASSIST", position));

        int cleanSheetPoints = cleanSheetPoints(stats, position, rules);
        if (cleanSheetPoints != 0 || isCleanSheetEligible(stats)) {
            addLine(lines, "Clean sheets", 1, cleanSheetPoints);
        }

        if (stats.getGoalsConceded() >= 3
                && (position == PlayerPosition.GOALKEEPER || position == PlayerPosition.DEFENDER)) {
            int extraGoals = stats.getGoalsConceded() - 2;
            addCountedLine(
                    lines,
                    "Goals conceded",
                    extraGoals,
                    rule(rules, "GOAL_CONCEDED_AFTER_2", position)
            );
        }

        addCountedLine(lines, "Yellow cards", stats.getYellowCards(), rule(rules, "YELLOW_CARD", position));
        addCountedLine(lines, "Own goals", stats.getOwnGoals(), rule(rules, "OWN_GOAL", position));
        addCountedLine(lines, "Red cards", stats.getRedCards(), rule(rules, "RED_CARD", position));
        addCountedLine(lines, "Penalties saved", stats.getPenaltiesSaved(), rule(rules, "PENALTY_SAVE", position));
        addCountedLine(lines, "Penalties missed", stats.getPenaltiesMissed(), rule(rules, "PENALTY_MISS", position));

        int penaltiesConceded = league == null || !applyGameweekCorrections
                ? stats.getPenaltiesConceded()
                : league.effectivePenaltiesConceded(
                        stats.getPlayer().getId(),
                        stats.getGameweek(),
                        stats.getPenaltiesConceded()
                );
        addCountedLine(
                lines,
                "Penalties conceded",
                penaltiesConceded,
                rule(rules, "PENALTY_CONCEDED", position)
        );

        int total = lines.stream().mapToInt(PlayerScoreBreakdown.Line::points).sum();
        return new PlayerScoreBreakdown(total, lines);
    }

    private List<PlayerScoreBreakdown> adjustFixtureLineCount(List<PlayerScoreBreakdown> source,
                                                              String label,
                                                              int delta,
                                                              int pointsPerEvent) {
        List<List<PlayerScoreBreakdown.Line>> fixtureLines = new ArrayList<>();
        source.forEach(score -> fixtureLines.add(new ArrayList<>(score.lines())));

        if (delta < 0) {
            int remaining = -delta;
            for (int fixtureIndex = fixtureLines.size() - 1;
                 fixtureIndex >= 0 && remaining > 0;
                 fixtureIndex--) {
                List<PlayerScoreBreakdown.Line> lines = fixtureLines.get(fixtureIndex);
                for (int lineIndex = 0; lineIndex < lines.size() && remaining > 0; lineIndex++) {
                    PlayerScoreBreakdown.Line line = lines.get(lineIndex);
                    if (!line.label().equals(label)) continue;
                    int removed = Math.min(line.count(), remaining);
                    int updatedCount = line.count() - removed;
                    remaining -= removed;
                    if (updatedCount == 0) {
                        lines.remove(lineIndex);
                        lineIndex--;
                    } else {
                        lines.set(lineIndex, new PlayerScoreBreakdown.Line(
                                label,
                                updatedCount,
                                updatedCount * pointsPerEvent
                        ));
                    }
                }
            }
        } else if (delta > 0) {
            List<PlayerScoreBreakdown.Line> lines = fixtureLines.getLast();
            int existingIndex = -1;
            for (int i = 0; i < lines.size(); i++) {
                if (lines.get(i).label().equals(label)) {
                    existingIndex = i;
                    break;
                }
            }
            if (existingIndex >= 0) {
                int updatedCount = lines.get(existingIndex).count() + delta;
                lines.set(existingIndex, new PlayerScoreBreakdown.Line(
                        label,
                        updatedCount,
                        updatedCount * pointsPerEvent
                ));
            } else {
                lines.add(new PlayerScoreBreakdown.Line(label, delta, delta * pointsPerEvent));
            }
        }

        return fixtureLines.stream()
                .map(lines -> new PlayerScoreBreakdown(
                        lines.stream().mapToInt(PlayerScoreBreakdown.Line::points).sum(),
                        lines
                ))
                .toList();
    }

    private void addCountedLine(List<PlayerScoreBreakdown.Line> lines,
                                String label,
                                int count,
                                int pointsPerEvent) {
        if (count > 0) addLine(lines, label, count, count * pointsPerEvent);
    }

    private void addLine(List<PlayerScoreBreakdown.Line> lines,
                         String label,
                         int count,
                         int points) {
        lines.add(new PlayerScoreBreakdown.Line(label, count, points));
    }

    private boolean isCleanSheetEligible(ScorablePlayerStats stats) {
        return stats.getGoalsConceded() == 0 && stats.getMinutesPlayed() >= 30;
    }

    private int cleanSheetPoints(ScorablePlayerStats stats,
                                 PlayerPosition position,
                                 Map<String, Integer> rules) {
        if (!isCleanSheetEligible(stats)) return 0;
        if (stats.getMinutesPlayed() >= 60) return rule(rules, "CLEAN_SHEET_60", position);
        if (stats.getMinutesPlayed() >= 46) return rule(rules, "CLEAN_SHEET_46", position);
        return rule(rules, "CLEAN_SHEET_30", position);
    }

    private int rule(Map<String, Integer> rules, String type, PlayerPosition position) {
        return rules.getOrDefault(
                type + "." + position.name(),
                rules.getOrDefault(type + ".ALL", 0)
        );
    }

    private Map<String, Integer> effectiveRules(LeagueEntity league) {
        Map<String, Integer> rules = new HashMap<>(LeagueScoringRules.defaults());
        if (league != null && league.getScoringRules() != null) {
            rules.putAll(league.getScoringRules());
        }
        return rules;
    }
}
