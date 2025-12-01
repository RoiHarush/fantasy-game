package com.fantasy.domain.game;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameWeekRepository extends JpaRepository<GameWeekEntity, Integer> {

    Optional<GameWeekEntity> findFirstByStatusOrderByIdAsc(String status);

    Optional<GameWeekEntity> findFirstByStatusOrderByIdDesc(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT gw FROM GameWeekEntity gw WHERE gw.id = :id")
    Optional<GameWeekEntity> findByIdWithLock(@Param("id") int id);
}

