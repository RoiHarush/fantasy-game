package com.fantasy.domain.transfer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeagueTransferActionRepository extends JpaRepository<LeagueTransferActionEntity, Long> {
    List<LeagueTransferActionEntity> findByLeague_IdAndGameWeek_IdOrderByIdAsc(Long leagueId, Integer gameWeekId);
}
