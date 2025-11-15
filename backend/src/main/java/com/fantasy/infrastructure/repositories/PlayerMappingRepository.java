package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.player.PlayerMappingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlayerMappingRepository extends JpaRepository<PlayerMappingEntity, Long> {
    Optional<PlayerMappingEntity> findByApiFootballId(int apiFootballId);
    Optional<PlayerMappingEntity> findByFplId(int fplId);
}
