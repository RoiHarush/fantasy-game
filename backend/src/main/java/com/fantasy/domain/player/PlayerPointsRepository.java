package com.fantasy.domain.player;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PlayerPointsRepository extends JpaRepository<PlayerPointsEntity, Long> {
    interface PlayerPointsTotal {
        Integer getPlayerId();
        Long getTotalPoints();
    }

    List<PlayerPointsEntity> findByPlayer_Id(Integer playerId);
    Optional<PlayerPointsEntity> findByPlayer_IdAndGameweek(Integer playerId, int gameweek);
    PlayerPointsEntity findFirstByGameweekOrderByPointsDesc(int gameweek);

    @Query("""
            select points.player.id as playerId, sum(points.points) as totalPoints
            from PlayerPointsEntity points
            group by points.player.id
            """)
    List<PlayerPointsTotal> findTotalPointsByPlayer();
}
