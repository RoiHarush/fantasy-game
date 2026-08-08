package com.fantasy.domain.transfer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplementalDraftPoolRepository
        extends JpaRepository<SupplementalDraftPoolEntity, Long> {

    boolean existsByLeague_IdAndPlayer_Id(Long leagueId, Integer playerId);
    List<SupplementalDraftPoolEntity> findByLeague_Id(Long leagueId);
    void deleteByLeague_Id(Long leagueId);
}
