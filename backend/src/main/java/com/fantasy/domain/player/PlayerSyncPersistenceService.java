package com.fantasy.domain.player;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlayerSyncPersistenceService {

    private final PlayerRepository playerRepository;
    private final PlayerGameweekStatsRepository statsRepository;
    private final PlayerPointsRepository pointsRepository;

    public PlayerSyncPersistenceService(PlayerRepository playerRepository,
                                        PlayerGameweekStatsRepository statsRepository,
                                        PlayerPointsRepository pointsRepository) {
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.pointsRepository = pointsRepository;
    }

    @Transactional
    public void persistInitialLoad(List<PlayerEntity> players,
                                   List<PlayerGameweekStatsEntity> stats,
                                   List<PlayerPointsEntity> points) {
        playerRepository.saveAll(players);
        statsRepository.saveAll(stats);
        pointsRepository.saveAll(points);
    }
}
