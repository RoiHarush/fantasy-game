package com.fantasy.domain.transfer;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LeagueTransferWindowRepository extends JpaRepository<LeagueTransferWindowEntity, Long> {

    Optional<LeagueTransferWindowEntity> findByLeague_IdAndGameWeek_IdAndWindowType(
            Long leagueId,
            Integer gameWeekId,
            TransferWindowType windowType
    );

    Optional<LeagueTransferWindowEntity> findFirstByLeague_IdAndStatusOrderByOpenedAtDesc(
            Long leagueId,
            TransferWindowStatus status
    );

    Optional<LeagueTransferWindowEntity> findFirstByLeague_IdOrderByIdDesc(Long leagueId);

    List<LeagueTransferWindowEntity> findAllByStatus(TransferWindowStatus status);

    boolean existsByLeague_IdAndStatus(Long leagueId, TransferWindowStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select w from LeagueTransferWindowEntity w
            where w.league.id = :leagueId and w.status = :status
            order by w.openedAt desc
            """)
    List<LeagueTransferWindowEntity> findByLeagueAndStatusForUpdate(
            @Param("leagueId") Long leagueId,
            @Param("status") TransferWindowStatus status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select w from LeagueTransferWindowEntity w
            where w.gameWeek.id = :gameWeekId and w.status = :status
            order by w.id
            """)
    List<LeagueTransferWindowEntity> findByGameweekAndStatusForUpdate(
            @Param("gameWeekId") Integer gameWeekId,
            @Param("status") TransferWindowStatus status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select w from LeagueTransferWindowEntity w
            where w.league.id = :leagueId
              and w.gameWeek.id = :gameWeekId
              and w.windowType = :windowType
            """)
    Optional<LeagueTransferWindowEntity> findConfiguredWindowForUpdate(
            @Param("leagueId") Long leagueId,
            @Param("gameWeekId") Integer gameWeekId,
            @Param("windowType") TransferWindowType windowType
    );
}
