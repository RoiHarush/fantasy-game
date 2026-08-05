package com.fantasy.domain.transfer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WaiverPreferenceRepository extends JpaRepository<WaiverPreferenceEntity, Long> {
    List<WaiverPreferenceEntity> findByLeague_IdAndUser_IdAndGameWeek_IdOrderByPriorityAsc(
            Long leagueId,
            Integer userId,
            Integer gameWeekId
    );

    void deleteByLeague_IdAndUser_IdAndGameWeek_Id(Long leagueId, Integer userId, Integer gameWeekId);
}
