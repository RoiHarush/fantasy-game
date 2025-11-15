package com.fantasy.application;


import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerMappingEntity;
import com.fantasy.infrastructure.repositories.PlayerMappingRepository;
import com.fantasy.infrastructure.repositories.PlayerRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PlayerMappingService {

    private final PlayerMappingRepository mappingRepo;
    private final PlayerRepository playerRepo;

    public PlayerMappingService(PlayerMappingRepository mappingRepo,
                                PlayerRepository playerRepo) {
        this.mappingRepo = mappingRepo;
        this.playerRepo = playerRepo;
    }

    public PlayerEntity findPlayerByApiId(int apiFootballId) {
        Optional<PlayerMappingEntity> mapping = mappingRepo.findByApiFootballId(apiFootballId);
        if (mapping.isEmpty()) {
            throw new RuntimeException("No mapping found for API-Football id " + apiFootballId);
        }
        int fplId = mapping.get().getFplId();
        return playerRepo.findById(fplId)
                .orElseThrow(() -> new RuntimeException("Player not found for fplId " + fplId));
    }

    public int getFplIdByApiFootballId(int apiFootballId) {
        return mappingRepo.findByApiFootballId(apiFootballId)
                .orElseThrow(() -> new RuntimeException("No mapping for apiFootballId: " + apiFootballId))
                .getFplId();
    }

    public int getApiFootballIdByFplId(int fplId) {
        return mappingRepo.findByFplId(fplId)
                .orElseThrow(() -> new RuntimeException("No mapping for fplId: " + fplId))
                .getApiFootballId();
    }
}
