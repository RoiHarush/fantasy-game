package com.fantasy.domain.player;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlayerSyncPersistenceService {

    private final PlayerRepository playerRepository;
    private final PlayerGameweekStatsRepository statsRepository;
    private final PlayerPointsRepository pointsRepository;
    private final LeaguePlayerPointsCache leaguePlayerPointsCache;

    public PlayerSyncPersistenceService(PlayerRepository playerRepository,
                                        PlayerGameweekStatsRepository statsRepository,
                                        PlayerPointsRepository pointsRepository,
                                        LeaguePlayerPointsCache leaguePlayerPointsCache) {
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.pointsRepository = pointsRepository;
        this.leaguePlayerPointsCache = leaguePlayerPointsCache;
    }

    @Transactional
    public void persistInitialLoad(List<PlayerEntity> players,
                                   List<PlayerGameweekStatsEntity> stats,
                                   List<PlayerPointsEntity> points) {
        playerRepository.saveAll(players);
        statsRepository.saveAll(stats);
        pointsRepository.saveAll(points);
        leaguePlayerPointsCache.invalidateAll();
    }
}
