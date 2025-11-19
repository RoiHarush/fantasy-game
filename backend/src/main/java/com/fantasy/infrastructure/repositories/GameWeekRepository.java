package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.game.GameWeekEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameWeekRepository extends JpaRepository<GameWeekEntity, Integer> {

    Optional<GameWeekEntity> findFirstByStatusOrderByIdAsc(String status);

    Optional<GameWeekEntity> findFirstByStatusOrderByIdDesc(String status);
}

