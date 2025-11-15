package com.fantasy.application;

import com.fantasy.domain.player.Player;
import com.fantasy.domain.player.PlayerEntity;
import com.fantasy.domain.player.PlayerRegistry;
import com.fantasy.domain.player.PlayerState;
import com.fantasy.domain.user.UserSquadEntity;
import com.fantasy.main.InMemoryData;
import com.fantasy.infrastructure.repositories.PlayerRepository;
import com.fantasy.infrastructure.repositories.UserSquadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlayerSyncService {

    @Autowired private UserSquadRepository squadRepo;
    @Autowired private PlayerRepository playerRepo;
    @Autowired private GameWeekService gameWeekService;


    public void fullSyncCurrentGw() {
        int gwId = gameWeekService.getNextGameweek().getId();
        fullSyncForGw(gwId);
    }

    public void fullSyncForGw(int gwId) {
        List<UserSquadEntity> gwSquads = squadRepo.findByGameweek(gwId);
        List<PlayerEntity> allPlayers = playerRepo.findAll();

        for (PlayerEntity p : allPlayers) {
            p.setOwnerId(-1);
            p.setState(PlayerState.NONE);
        }

        for (UserSquadEntity squad : gwSquads) {
            int userId = squad.getUser().getId();

            for (Integer pid : squad.getStartingLineup()) {
                playerRepo.findById(pid).ifPresent(p -> {
                    p.setOwnerId(userId);
                    p.setState(PlayerState.STARTING);
                });
            }

            for (Integer pid : squad.getBenchMap().values()) {
                playerRepo.findById(pid).ifPresent(p -> {
                    p.setOwnerId(userId);
                    p.setState(PlayerState.BENCH);
                });
            }
        }

        playerRepo.saveAll(allPlayers);

        PlayerRegistry domainPlayers = InMemoryData.getPlayers();

        domainPlayers.getPlayers().forEach(p -> {
            p.setOwnerId(-1);
            p.setState(PlayerState.NONE);
        });

        for (UserSquadEntity squad : gwSquads) {
            int userId = squad.getUser().getId();

            for (Integer pid : squad.getStartingLineup()) {
                Player dp = domainPlayers.getById(pid);
                if (dp != null) {
                    dp.setOwnerId(userId);
                    dp.setState(PlayerState.STARTING);
                }
            }

            for (Integer pid : squad.getBenchMap().values()) {
                Player dp = domainPlayers.getById(pid);
                if (dp != null) {
                    dp.setOwnerId(userId);
                    dp.setState(PlayerState.BENCH);
                }
            }
        }

        System.out.println("✅ Sync done for GW " + gwId + " (DB + Domain).");
    }
}
