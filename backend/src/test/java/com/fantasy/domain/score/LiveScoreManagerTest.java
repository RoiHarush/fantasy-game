package com.fantasy.domain.score;

import com.fantasy.domain.game.FixtureEntity;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerFixtureStatsEntity;
import com.fantasy.domain.player.PlayerPosition;
import com.fantasy.domain.player.RawGameStats;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LiveScoreManagerTest {

    @Test
    void singleFixtureUsesCompleteAggregateStatsMissingFromFplExplanation() {
        FixtureEntity fixture = new FixtureEntity();
        fixture.setHomeTeamId(16);
        fixture.setAwayTeamId(5);

        RawGameStats aggregate = new RawGameStats(
                79,
                0,
                0,
                2,
                0,
                0,
                0,
                0,
                0,
                true,
                0,
                false
        );

        RawGameStats fixtureStats = LiveScoreManager.withFixtureContext(aggregate, 16, fixture);

        assertEquals(79, fixtureStats.minutes());
        assertEquals(2, fixtureStats.goalsConceded());
        assertEquals(5, fixtureStats.opponentTeamId());
        assertTrue(fixtureStats.wasHome());
        assertTrue(fixtureStats.started());

        PlayerEntity player = new PlayerEntity();
        player.setId(428);
        player.setPosition(PlayerPosition.FORWARD);
        PlayerFixtureStatsEntity persistedStats = new PlayerFixtureStatsEntity();
        persistedStats.setPlayer(player);
        persistedStats.setFixture(fixture);

        LeagueScoringService scoringService = new LeagueScoringService();
        new PlayerStatsUpdater(scoringService).update(persistedStats, fixtureStats);

        assertFalse(scoringService.calculateFixturePlayerScore(persistedStats, null).lines().stream()
                .anyMatch(line -> line.label().equals("Clean sheets")));
    }

    @Test
    void singleFixturePreservesSubstituteAppearanceInsteadOfTreatingItAsAStart() {
        FixtureEntity fixture = new FixtureEntity();
        fixture.setHomeTeamId(16);
        fixture.setAwayTeamId(5);

        RawGameStats aggregate = new RawGameStats(
                20,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                false,
                0,
                false
        );
        RawGameStats fixtureStats = LiveScoreManager.withFixtureContext(aggregate, 16, fixture);

        PlayerEntity player = new PlayerEntity();
        player.setId(429);
        player.setPosition(PlayerPosition.MIDFIELDER);
        PlayerFixtureStatsEntity persistedStats = new PlayerFixtureStatsEntity();
        persistedStats.setPlayer(player);
        persistedStats.setFixture(fixture);

        LeagueScoringService scoringService = new LeagueScoringService();
        new PlayerStatsUpdater(scoringService).update(persistedStats, fixtureStats);
        PlayerScoreBreakdown score = scoringService.calculateFixturePlayerScore(persistedStats, null);

        assertFalse(persistedStats.isStarted());
        assertEquals(1, score.totalPoints());
        assertTrue(score.lines().stream().anyMatch(line ->
                line.label().equals("Minutes played") && line.points() == 1));
    }

    @Test
    void singleFixturePreservesStartingAppearanceWorthTwoPoints() {
        FixtureEntity fixture = new FixtureEntity();
        fixture.setHomeTeamId(16);
        fixture.setAwayTeamId(5);

        RawGameStats aggregate = new RawGameStats(
                79,
                0,
                0,
                2,
                0,
                0,
                0,
                0,
                0,
                true,
                0,
                false
        );
        RawGameStats fixtureStats = LiveScoreManager.withFixtureContext(aggregate, 16, fixture);

        PlayerEntity player = new PlayerEntity();
        player.setId(430);
        player.setPosition(PlayerPosition.FORWARD);
        PlayerFixtureStatsEntity persistedStats = new PlayerFixtureStatsEntity();
        persistedStats.setPlayer(player);
        persistedStats.setFixture(fixture);

        LeagueScoringService scoringService = new LeagueScoringService();
        new PlayerStatsUpdater(scoringService).update(persistedStats, fixtureStats);
        PlayerScoreBreakdown score = scoringService.calculateFixturePlayerScore(persistedStats, null);

        assertTrue(persistedStats.isStarted());
        assertEquals(2, score.totalPoints());
        assertTrue(score.lines().stream().anyMatch(line ->
                line.label().equals("Minutes played") && line.points() == 2));
    }
}
