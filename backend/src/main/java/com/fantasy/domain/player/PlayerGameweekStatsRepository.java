package com.fantasy.domain.player;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlayerGameweekStatsRepository extends JpaRepository<PlayerGameweekStatsEntity, Long> {
    List<PlayerGameweekStatsEntity> findByPlayer_Id(int playerId);
    Optional<PlayerGameweekStatsEntity> findByPlayer_IdAndGameweek(int playerId, int gameweek);
    List<PlayerGameweekStatsEntity> findByGameweek(int gameweek);
    @Query("SELECT new com.fantasy.domain.player.PlayerAssistedDto(s.player.id, s.player.viewName, s.assists, s.player.teamId) " +
            "FROM PlayerGameweekStatsEntity s " +
            "WHERE s.gameweek = :gwId AND s.assists > 0")
    List<PlayerAssistedDto> findPlayersWithAssists(@Param("gwId") int gwId);

    @Query("SELECT new com.fantasy.domain.player.PlayerPenaltyDto(s.player.id, s.player.viewName, s.penaltiesConceded, s.player.teamId) " +
            "FROM PlayerGameweekStatsEntity s " +
            "WHERE s.gameweek = :gameweek AND s.penaltiesConceded > 0")
    List<PlayerPenaltyDto> findPlayersWithPenalties(@Param("gameweek") int gameweek);
}
