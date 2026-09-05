package com.fantasy.domain.player;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerFixtureStatsRepository extends JpaRepository<PlayerFixtureStatsEntity, Long> {
    Optional<PlayerFixtureStatsEntity> findByPlayer_IdAndFixture_Id(int playerId, int fixtureId);
    List<PlayerFixtureStatsEntity> findByGameweek(int gameweek);
    List<PlayerFixtureStatsEntity> findByFixture_IdIn(List<Integer> fixtureIds);
    List<PlayerFixtureStatsEntity> findByPlayer_IdAndGameweekOrderByFixture_KickoffTime(int playerId, int gameweek);
    List<PlayerFixtureStatsEntity> findByPlayer_IdOrderByGameweekAscFixture_KickoffTimeAsc(int playerId);
}
