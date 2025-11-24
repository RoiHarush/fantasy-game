package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import com.fantasy.dto.PlayerAssistedDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PlayerGameweekStatsRepository extends JpaRepository<PlayerGameweekStatsEntity, Long> {
    List<PlayerGameweekStatsEntity> findByPlayer_Id(int playerId);
    Optional<PlayerGameweekStatsEntity> findByPlayer_IdAndGameweek(int playerId, int gameweek);
    List<PlayerGameweekStatsEntity> findByGameweek(int gameweek);
    @Query("SELECT new com.fantasy.dto.PlayerAssistedDto(s.player.id, s.player.viewName, s.assists, s.player.teamId) " +
            "FROM PlayerGameweekStatsEntity s " +
            "WHERE s.gameweek = :gwId AND s.assists > 0")
    List<PlayerAssistedDto> findPlayersWithAssists(@Param("gwId") int gwId);
}
