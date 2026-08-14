package com.fantasy.domain.league;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.List;

public interface LeagueRepository extends JpaRepository<LeagueEntity, Long> {
    Optional<LeagueEntity> findByLeagueCodeIgnoreCase(String leagueCode);
    Optional<LeagueEntity> findFirstByUsers_Id(Integer userId);
    boolean existsByLeagueCodeIgnoreCase(String leagueCode);
    boolean existsByUsers_Id(Integer userId);

    @Query("select user.id from LeagueEntity league join league.users user where league.id = :leagueId")
    List<Integer> findUserIdsByLeagueId(@Param("leagueId") Long leagueId);

    @Query("select league.id from LeagueEntity league where league.status = :status")
    List<Long> findIdsByStatus(@Param("status") LeagueStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select league from LeagueEntity league where upper(league.leagueCode) = upper(:leagueCode)")
    Optional<LeagueEntity> findByLeagueCodeWithLock(@Param("leagueCode") String leagueCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select league from LeagueEntity league where league.id = :leagueId")
    Optional<LeagueEntity> findByIdWithLock(@Param("leagueId") Long leagueId);
}


