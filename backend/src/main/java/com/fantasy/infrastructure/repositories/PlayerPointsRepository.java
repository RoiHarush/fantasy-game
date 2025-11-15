package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.player.PlayerPointsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlayerPointsRepository extends JpaRepository<PlayerPointsEntity, Long> {
    List<PlayerPointsEntity> findByPlayer_Id(Integer playerId);
    Optional<PlayerPointsEntity> findByPlayer_IdAndGameweek(Integer playerId, int gameweek);
}
