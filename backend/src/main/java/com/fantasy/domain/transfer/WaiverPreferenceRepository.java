package com.fantasy.domain.transfer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WaiverPreferenceRepository extends JpaRepository<WaiverPreferenceEntity, Long> {
    List<WaiverPreferenceEntity> findByLeague_IdAndUser_IdAndGameWeek_IdAndPlanTypeOrderByPriorityAsc(
            Long leagueId,
            Integer userId,
            Integer gameWeekId,
            WaiverPlanType planType
    );

    void deleteByLeague_IdAndUser_IdAndGameWeek_IdAndPlanType(
            Long leagueId,
            Integer userId,
            Integer gameWeekId,
            WaiverPlanType planType
    );
}
