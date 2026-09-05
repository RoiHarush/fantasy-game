package com.fantasy.domain.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserSquadRepository extends JpaRepository<UserSquadEntity, Long> {
    Optional<UserSquadEntity> findByUser_IdAndGameweek(int userId, int gameweek);
    List<UserSquadEntity> findByUser_Id(int userId);
    Optional<UserSquadEntity> findTopByUser_IdOrderByGameweekDesc(int userId);
    List<UserSquadEntity> findByGameweek(int gameweek);

    @Query("""
    SELECT DISTINCT s FROM UserSquadEntity s
    JOIN FETCH s.user gameData
    JOIN FETCH gameData.user manager
    WHERE gameData.league.id = :leagueId
      AND s.gameweek = :gameweek
    """)
    List<UserSquadEntity> findByLeagueIdAndGameweek(
            @Param("leagueId") long leagueId,
            @Param("gameweek") int gameweek
    );

    @Query("SELECT s FROM UserSquadEntity s WHERE s.gameweek IN :gameweeks")
    List<UserSquadEntity> findAllByGameweeks(@Param("gameweeks") List<Integer> gameweeks);

}
