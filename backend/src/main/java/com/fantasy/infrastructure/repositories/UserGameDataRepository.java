package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.user.UserGameDataEntity; // <-- השתנה
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param; // <-- צריך להוסיף

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

    @Query("""
    SELECT DISTINCT g FROM UserGameDataEntity g
    LEFT JOIN FETCH g.pointsByGameweek
    LEFT JOIN FETCH g.currentSquad
    LEFT JOIN FETCH g.nextSquad
    LEFT JOIN FETCH g.chips
    """)
    List<UserGameDataEntity> findAllWithRelations();

    @Query("""
    SELECT g.id AS userId, key(c) AS chipName, value(c) AS chipCount
    FROM UserGameDataEntity g
    JOIN g.chips c
    """)
    List<Object[]> findAllChipsRaw();
}

