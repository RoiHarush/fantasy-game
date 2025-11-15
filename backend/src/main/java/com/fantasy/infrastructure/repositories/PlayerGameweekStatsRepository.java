package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.player.PlayerGameweekStatsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerGameweekStatsRepository extends JpaRepository<PlayerGameweekStatsEntity, Long> {
    List<PlayerGameweekStatsEntity> findByPlayer_Id(int playerId);
    Optional<PlayerGameweekStatsEntity> findByPlayer_IdAndGameweek(int playerId, int gameweek);
}
