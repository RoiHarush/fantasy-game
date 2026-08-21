package com.fantasy.domain.transfer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDateTime;

public interface SupplementalDraftPoolRepository
        extends JpaRepository<SupplementalDraftPoolEntity, Long> {

    boolean existsByLeague_IdAndPlayer_Id(Long leagueId, Integer playerId);
    boolean existsByLeague_IdAndPlayer_IdAndDiscoveredAtLessThanEqual(
            Long leagueId,
            Integer playerId,
            LocalDateTime cutoff
    );
    List<SupplementalDraftPoolEntity> findByLeague_Id(Long leagueId);
    List<SupplementalDraftPoolEntity> findByLeague_IdAndDiscoveredAtLessThanEqual(
            Long leagueId,
            LocalDateTime cutoff
    );
    void deleteByLeague_IdAndPlayer_Id(Long leagueId, Integer playerId);
    void deleteByLeague_IdAndDiscoveredAtLessThanEqual(Long leagueId, LocalDateTime cutoff);
}
