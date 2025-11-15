package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.game.GameWeekEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameWeekRepository extends JpaRepository<GameWeekEntity, Integer> {
}

