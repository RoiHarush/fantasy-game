package com.fantasy.domain.league;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerMapper;
import com.fantasy.domain.player.PlayerPointsEntity;
import com.fantasy.domain.player.PlayerPointsRepository;
import com.fantasy.domain.player.PlayerRepository;
import com.fantasy.domain.player.PlayerState;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Builds a request-local player view from the database; no mutable state is shared. */
@Service
public class LeaguePlayerCatalog {

    private final PlayerRepository playerRepository;
    private final PlayerPointsRepository pointsRepository;

    public LeaguePlayerCatalog(PlayerRepository playerRepository,
                               PlayerPointsRepository pointsRepository) {
        this.playerRepository = playerRepository;
        this.pointsRepository = pointsRepository;
    }

    @Transactional(readOnly = true)
    public Map<Integer, Player> load(LeagueEntity league) {
        Map<Integer, List<PlayerPointsEntity>> pointsByPlayer = pointsRepository.findAll().stream()
                .collect(Collectors.groupingBy(points -> points.getPlayer().getId()));
        Map<Integer, Player> result = new LinkedHashMap<>();
        playerRepository.findAll().forEach(entity -> {
            Player player = PlayerMapper.toDomain(
                    entity,
                    pointsByPlayer.getOrDefault(entity.getId(), List.of())
            );
            if (league != null) {
                player.setPosition(league.effectivePosition(entity));
                player.setState(league.isPlayerLocked(entity.getId()) ? PlayerState.LOCKED : PlayerState.NONE);
            } else {
                player.setState(PlayerState.NONE);
            }
            player.setOwnerId(-1);
            result.put(player.getId(), player);
        });
        return result;
    }
}
