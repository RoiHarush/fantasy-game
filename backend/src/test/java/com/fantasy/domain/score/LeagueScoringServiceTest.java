package com.fantasy.domain.score;

import com.fantasy.domain.league.LeagueEntity;
import com.fantasy.domain.league.LeagueScoringRules;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.team.UserSquadEntity;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
}
