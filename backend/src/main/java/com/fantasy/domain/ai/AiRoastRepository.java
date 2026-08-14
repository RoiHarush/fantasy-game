package com.fantasy.domain.ai;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiRoastRepository extends JpaRepository<AiRoastEntity, Long> {
    Optional<AiRoastEntity> findByUser_IdAndGameweek(int userId, int gameweek);
}

