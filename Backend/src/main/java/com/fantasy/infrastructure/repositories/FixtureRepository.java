package com.fantasy.infrastructure.repositories;


import com.fantasy.domain.game.FixtureEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FixtureRepository extends JpaRepository<FixtureEntity, Integer> {

    List<FixtureEntity> findByGameweekId(int gameweekId);

    Optional<FixtureEntity> findByHomeTeamIdAndAwayTeamIdAndGameweekId(int homeTeamId, int awayTeamId, int gameweekId);
    Optional<FixtureEntity> findByGameweekIdAndHomeTeamIdOrGameweekIdAndAwayTeamId(int gw1, int teamId1, int gw2, int teamId2);

    @Query("""
    SELECT f FROM FixtureEntity f
    WHERE f.gameweekId = :gameweekId
      AND (f.homeTeamId = :teamId OR f.awayTeamId = :teamId)
""")
    Optional<FixtureEntity> findByGameweekAndTeam(
            @Param("gameweekId") int gameweekId,
            @Param("teamId") int teamId
    );

}
