package com.fantasy.infrastructure.repositories;

import com.fantasy.domain.user.UserSquadEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserSquadRepository extends JpaRepository<UserSquadEntity, Long> {
    Optional<UserSquadEntity> findByUser_IdAndGameweek(int userId, int gameweek);
    List<UserSquadEntity> findByUser_Id(int userId);
    Optional<UserSquadEntity> findTopByUser_IdOrderByGameweekDesc(int userId);
    List<UserSquadEntity> findByGameweek(int gameweek);

    @Query("SELECT s FROM UserSquadEntity s WHERE s.gameweek IN :gameweeks")
    List<UserSquadEntity> findAllByGameweeks(@Param("gameweeks") List<Integer> gameweeks);

    @Query("SELECT s.user.id FROM UserSquadEntity s " +
            "LEFT JOIN s.startingLineup starter " +
            "LEFT JOIN s.benchMap bench " +
            "WHERE s.gameweek = :gameweek " +
            "AND (starter = :playerId OR bench = :playerId)")
    Optional<Integer> findOwnerByPlayerAndGameweek(@Param("playerId") int playerId,
                                                   @Param("gameweek") int gameweek);
}
