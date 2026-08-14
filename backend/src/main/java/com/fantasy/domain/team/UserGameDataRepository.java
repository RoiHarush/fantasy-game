package com.fantasy.domain.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface UserGameDataRepository extends JpaRepository<UserGameDataEntity, Integer> {

    @Query("""
    SELECT g FROM UserGameDataEntity g
    LEFT JOIN FETCH g.currentSquad
    LEFT JOIN FETCH g.nextSquad
    WHERE g.user.id = :userId
""")
    Optional<UserGameDataEntity> findByUserId(@Param("userId") Integer userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT g FROM UserGameDataEntity g
    JOIN FETCH g.user
    LEFT JOIN FETCH g.league
    WHERE g.user.id = :userId
    """)
    Optional<UserGameDataEntity> findByUserIdForUpdate(@Param("userId") Integer userId);

    @Query("""
    SELECT DISTINCT g FROM UserGameDataEntity g
    LEFT JOIN FETCH g.pointsByGameweek
    LEFT JOIN FETCH g.currentSquad
    LEFT JOIN FETCH g.nextSquad
    LEFT JOIN FETCH g.chips
    WHERE g.league IS NOT NULL
    """)
    List<UserGameDataEntity> findAllWithRelations();

    @Query("""
    SELECT DISTINCT g FROM UserGameDataEntity g
    JOIN FETCH g.user
    LEFT JOIN FETCH g.currentSquad
    LEFT JOIN FETCH g.nextSquad
    WHERE g.league.id = :leagueId
    """)
    List<UserGameDataEntity> findAllByLeagueIdWithSquads(@Param("leagueId") Long leagueId);

    List<UserGameDataEntity> findByLeague_Id(Long leagueId);

    List<UserGameDataEntity> findByLeagueIsNull();

    @Query("SELECT g.user.id FROM UserGameDataEntity g WHERE g.user IS NOT NULL AND g.league IS NOT NULL")
    List<Integer> findAllRealUserIds();

    @Query("""
    SELECT g.id AS userId, key(c) AS chipName, value(c) AS chipCount
    FROM UserGameDataEntity g
    JOIN g.chips c
    """)
    List<Object[]> findAllChipsRaw();
}

