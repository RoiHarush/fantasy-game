package com.fantasy.domain.transfer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WaiverPlanProgressRepository extends JpaRepository<WaiverPlanProgressEntity, Long> {
    Optional<WaiverPlanProgressEntity> findByLeague_IdAndUser_IdAndGameWeek_Id(
            Long leagueId,
            Integer userId,
            Integer gameWeekId
    );

    void deleteByLeague_IdAndUser_IdAndGameWeek_Id(Long leagueId, Integer userId, Integer gameWeekId);
}
