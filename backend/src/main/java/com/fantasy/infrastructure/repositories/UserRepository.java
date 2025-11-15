package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.user.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {

    Optional<UserEntity> findByUsername(String username);

    @Query("""
    SELECT DISTINCT u FROM UserEntity u
    LEFT JOIN FETCH u.pointsByGameweek
    LEFT JOIN FETCH u.currentSquad
    LEFT JOIN FETCH u.nextSquad
    LEFT JOIN FETCH u.chips
""")
    List<UserEntity> findAllWithRelations();

    @Query("""
    SELECT u.id AS userId, key(c) AS chipName, value(c) AS chipCount
    FROM UserEntity u
    JOIN u.chips c
""")
    List<Object[]> findAllChipsRaw();


}

