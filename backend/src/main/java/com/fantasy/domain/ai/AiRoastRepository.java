package com.fantasy.domain.ai;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiRoastRepository extends JpaRepository<AiRoastEntity, Long> {
    List<AiRoastEntity> findByLeague_IdAndGameweekOrderByRotationIndexAsc(long leagueId, int gameweek);
}

