package com.fantasy.domain.score;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueScoringRules;
import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerFixtureStatsEntity;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.team.UserSquadEntity;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class LeagueScoringServiceTest {

    private final LeagueScoringService scoringService = new LeagueScoringService();

    @Test
    void appliesLeagueRuleOverridesAndCaptainMultiplier() {
        LeagueEntity league = new LeagueEntity();
        Map<String, Integer> rules = new HashMap<>(LeagueScoringRules.defaults());
        rules.put("GOAL.FORWARD", 10);
        league.setScoringRules(rules);

        PlayerGameweekStatsEntity stats = stats(9, PlayerPosition.FORWARD);
        stats.setMinutesPlayed(90);
        stats.setStarted(true);
        stats.setGoals(2);

        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(new ArrayList<>(List.of(9)));
        squad.setCaptainId(9);

        int points = scoringService.calculateSquadPoints(league, squad, Map.of(9, stats));

        assertEquals(46, points); // (2 played + 20 goals + 1 second-goal bonus) * captain
    }

    @Test
    void tripleCaptainUsesAThreeTimesMultiplier() {
        LeagueEntity league = new LeagueEntity();
        league.setScoringRules(new HashMap<>(LeagueScoringRules.defaults()));

        PlayerGameweekStatsEntity captainStats = stats(9, PlayerPosition.FORWARD);
        captainStats.setMinutesPlayed(90);
        captainStats.setStarted(true);
        captainStats.setGoals(1);

        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(new ArrayList<>(List.of(9)));
        squad.setCaptainId(9);
        squad.setTripleCaptainActive(true);

        assertEquals(18, scoringService.calculateSquadPoints(league, squad, Map.of(9, captainStats)));
    }

    @Test
    void tripleCaptainMultipliesTheSumOfEveryDoubleGameweekFixtureExactlyOnce() {
        LeagueEntity league = new LeagueEntity();
        league.setScoringRules(new HashMap<>(LeagueScoringRules.defaults()));

        PlayerGameweekStatsEntity aggregate = stats(9, PlayerPosition.FORWARD);
        aggregate.setGameweek(4);
        aggregate.setMinutesPlayed(180);
        aggregate.setStarted(true);
        aggregate.setGoals(1);

        PlayerFixtureStatsEntity firstMatch = fixtureStats(aggregate.getPlayer(), 401, 4);
        firstMatch.setMinutesPlayed(90);
        firstMatch.setStarted(true);

        PlayerFixtureStatsEntity secondMatch = fixtureStats(aggregate.getPlayer(), 402, 4);
        secondMatch.setMinutesPlayed(90);
        secondMatch.setStarted(true);
        secondMatch.setGoals(1);

        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(new ArrayList<>(List.of(9)));
        squad.setCaptainId(9);
        squad.setTripleCaptainActive(true);

        int points = scoringService.calculateSquadPoints(
                league,
                squad,
                Map.of(9, aggregate),
                Map.of(9, List.of(firstMatch, secondMatch))
        );

        assertEquals(24, points); // (2 points + 6 points) * 3, with no second aggregation pass
    }

    @Test
    void doubleGameweekCleanSheetsAreScoredPerFixtureInsteadOfFromAggregatedStats() {
        LeagueEntity league = new LeagueEntity();
        league.setScoringRules(new HashMap<>(LeagueScoringRules.defaults()));

        PlayerGameweekStatsEntity aggregate = stats(4, PlayerPosition.DEFENDER);
        aggregate.setGameweek(7);
        aggregate.setMinutesPlayed(180);
        aggregate.setStarted(true);
        aggregate.setGoalsConceded(1);

        PlayerFixtureStatsEntity cleanSheet = fixtureStats(aggregate.getPlayer(), 701, 7);
        cleanSheet.setMinutesPlayed(90);
        cleanSheet.setStarted(true);

        PlayerFixtureStatsEntity conceded = fixtureStats(aggregate.getPlayer(), 702, 7);
        conceded.setMinutesPlayed(90);
        conceded.setStarted(true);
        conceded.setGoalsConceded(1);

        assertEquals(
                8,
                scoringService.calculatePlayerGameweekPoints(
                        aggregate,
                        List.of(cleanSheet, conceded),
                        league
                )
        ); // 6 in the clean sheet fixture + 2 in the other fixture
    }

    @Test
    void benchBoostAddsEveryBenchPlayersPoints() {
        LeagueEntity league = new LeagueEntity();
        league.setScoringRules(new HashMap<>(LeagueScoringRules.defaults()));

        PlayerGameweekStatsEntity starter = stats(1, PlayerPosition.FORWARD);
        starter.setMinutesPlayed(90);
        starter.setStarted(true);

        Map<Integer, PlayerGameweekStatsEntity> stats = new HashMap<>();
        stats.put(1, starter);
        Map<String, Integer> bench = new HashMap<>();
        for (int playerId = 2; playerId <= 5; playerId++) {
            PlayerGameweekStatsEntity substitute = stats(playerId, PlayerPosition.MIDFIELDER);
            substitute.setMinutesPlayed(30);
            bench.put("S" + playerId, playerId);
            stats.put(playerId, substitute);
        }

        UserSquadEntity squad = new UserSquadEntity();
        squad.setStartingLineup(new ArrayList<>(List.of(1)));
        squad.setBenchMap(bench);
        squad.setBenchBoostActive(true);

        assertEquals(6, scoringService.calculateSquadPoints(league, squad, stats));
    }

    @Test
    void keepsCleanSheetTiersModular() {
        LeagueEntity league = new LeagueEntity();
        Map<String, Integer> rules = new HashMap<>(LeagueScoringRules.defaults());
        rules.put("CLEAN_SHEET_46.DEFENDER", 7);
        league.setScoringRules(rules);
        PlayerGameweekStatsEntity stats = stats(4, PlayerPosition.DEFENDER);
        stats.setMinutesPlayed(50);
        stats.setStarted(true);
        stats.setGoalsConceded(0);

        assertEquals(9, scoringService.calculatePlayerPoints(stats, league));
    }

    @Test
    void appliesLeagueSpecificPositionAndAssistCorrection() {
        LeagueEntity league = new LeagueEntity();
        league.setScoringRules(new HashMap<>(LeagueScoringRules.defaults()));
        PlayerGameweekStatsEntity stats = stats(4, PlayerPosition.MIDFIELDER);
        stats.setGameweek(3);
        stats.setAssists(1);
        league.setPlayerPosition(stats.getPlayer(), PlayerPosition.FORWARD);
        league.adjustAssists(4, 3, 1, 1);

        assertEquals(6, scoringService.calculatePlayerPoints(stats, league));
    }

    @Test
    void removesCorrectedAssistFromGameweekAndFixtureBreakdowns() {
        LeagueEntity league = new LeagueEntity();
        league.setScoringRules(new HashMap<>(LeagueScoringRules.defaults()));
        PlayerGameweekStatsEntity aggregate = stats(4, PlayerPosition.MIDFIELDER);
        aggregate.setGameweek(3);
        aggregate.setMinutesPlayed(90);
        aggregate.setStarted(true);
        aggregate.setAssists(1);
        aggregate.setGoalsConceded(1);
        PlayerFixtureStatsEntity fixture = fixtureStats(aggregate.getPlayer(), 301, 3);
        fixture.setMinutesPlayed(90);
        fixture.setStarted(true);
        fixture.setAssists(1);
        fixture.setGoalsConceded(1);
        league.adjustAssists(4, 3, 1, -1);

        PlayerScoreBreakdown gameweekScore = scoringService.calculatePlayerGameweekScore(
                aggregate,
                List.of(fixture),
                league
        );
        PlayerScoreBreakdown fixtureScore = scoringService.calculatePlayerGameweekFixtureScores(
                aggregate,
                List.of(fixture),
                league
        ).getFirst();

        assertEquals(2, gameweekScore.totalPoints());
        assertEquals(2, fixtureScore.totalPoints());
        assertFalse(gameweekScore.lines().stream().anyMatch(line -> line.label().equals("Assists")));
        assertFalse(fixtureScore.lines().stream().anyMatch(line -> line.label().equals("Assists")));
    }

    @Test
    void appliesGameweekCorrectionOnlyOnceAcrossMultipleFixtures() {
        LeagueEntity league = new LeagueEntity();
        league.setScoringRules(new HashMap<>(LeagueScoringRules.defaults()));
        PlayerGameweekStatsEntity aggregate = stats(4, PlayerPosition.MIDFIELDER);
        aggregate.setGameweek(3);
        aggregate.setAssists(2);
        PlayerFixtureStatsEntity first = fixtureStats(aggregate.getPlayer(), 301, 3);
        first.setAssists(1);
        PlayerFixtureStatsEntity second = fixtureStats(aggregate.getPlayer(), 302, 3);
        second.setAssists(1);
        league.adjustAssists(4, 3, 2, -1);

        List<PlayerScoreBreakdown> fixtureScores = scoringService.calculatePlayerGameweekFixtureScores(
                aggregate,
                List.of(first, second),
                league
        );

        assertEquals(1, fixtureScores.stream()
                .flatMap(score -> score.lines().stream())
                .filter(line -> line.label().equals("Assists"))
                .mapToInt(PlayerScoreBreakdown.Line::count)
                .sum());
        assertEquals(3, scoringService.calculatePlayerGameweekScore(
                aggregate,
                List.of(first, second),
                league
        ).totalPoints());
    }

    @Test
    void appliesLeagueSpecificPenaltyCorrection() {
        LeagueEntity league = new LeagueEntity();
        league.setScoringRules(new HashMap<>(LeagueScoringRules.defaults()));
        PlayerGameweekStatsEntity stats = stats(8, PlayerPosition.DEFENDER);
        stats.setGameweek(6);
        stats.setPenaltiesConceded(1);
        league.adjustPenaltiesConceded(8, 6, 1, 1);

        assertEquals(-4, scoringService.calculatePlayerPoints(stats, league));
    }

    @Test
    void defaultRulesScoreGoalsByPosition() {
        assertGoalPoints(PlayerPosition.GOALKEEPER, 10);
        assertGoalPoints(PlayerPosition.DEFENDER, 6);
        assertGoalPoints(PlayerPosition.MIDFIELDER, 5);
        assertGoalPoints(PlayerPosition.FORWARD, 4);
    }

    @Test
    void breakdownAndPersistedTotalUseTheSameCalculation() {
        PlayerGameweekStatsEntity stats = stats(12, PlayerPosition.FORWARD);
        stats.setMinutesPlayed(90);
        stats.setStarted(true);
        stats.setGoals(2);
        stats.setAssists(1);
        stats.setYellowCards(1);

        PlayerScoreBreakdown breakdown = scoringService.calculatePlayerScore(stats, null);

        assertEquals(13, breakdown.totalPoints());
        assertEquals(
                breakdown.totalPoints(),
                breakdown.lines().stream().mapToInt(PlayerScoreBreakdown.Line::points).sum()
        );
    }

    private void assertGoalPoints(PlayerPosition position, int expectedPoints) {
        PlayerGameweekStatsEntity stats = stats(100 + position.ordinal(), position);
        stats.setGoals(1);
        assertEquals(expectedPoints, scoringService.calculatePlayerPoints(stats, null));
    }

    private PlayerGameweekStatsEntity stats(int playerId, PlayerPosition position) {
        PlayerEntity player = new PlayerEntity();
        player.setId(playerId);
        player.setPosition(position);
        PlayerGameweekStatsEntity stats = new PlayerGameweekStatsEntity();
        stats.setPlayer(player);
        return stats;
    }

    private PlayerFixtureStatsEntity fixtureStats(PlayerEntity player, int fixtureId, int gameweek) {
        FixtureEntity fixture = new FixtureEntity();
        fixture.setId(fixtureId);
        fixture.setGameweekId(gameweek);
        PlayerFixtureStatsEntity stats = new PlayerFixtureStatsEntity();
        stats.setPlayer(player);
        stats.setFixture(fixture);
        stats.setGameweek(gameweek);
        return stats;
    }
}
