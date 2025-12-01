package com.fantasy.domain.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserPointsRepository extends JpaRepository<UserPointsEntity, Long> {
    Optional<UserPointsEntity> findByUser_IdAndGameweek(int userId, int gameweek);

    @Query("SELECT COALESCE(SUM(p.points), 0) FROM UserPointsEntity p WHERE p.user.id = :userId")
    int sumPointsByUserId(@Param("userId") int userId);

    List<UserPointsEntity> findByGameweek(int gameweek);

}
