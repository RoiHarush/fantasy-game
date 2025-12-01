package com.fantasy.domain.score;

import com.fantasy.domain.player.PlayerPointsUpdateEvent;
import com.fantasy.domain.team.UserSquadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ScoreEventListener {

    private static final Logger log = LoggerFactory.getLogger(ScoreEventListener.class);

    private final PointsService pointsService;
    private final UserSquadRepository squadRepo;

    public ScoreEventListener(PointsService pointsService, UserSquadRepository squadRepo) {
        this.pointsService = pointsService;
        this.squadRepo = squadRepo;
    }

    @EventListener
    public void handlePlayerUpdate(PlayerPointsUpdateEvent event) {
        log.info("Event received: Player {} updated in GW {}. Checking if recalculation is needed...", event.getPlayerId(), event.getGameweek());

        Optional<Integer> historicOwnerId = squadRepo.findOwnerByPlayerAndGameweek(event.getPlayerId(), event.getGameweek());

        historicOwnerId.ifPresent(ownerId -> {
            try {
                pointsService.calculateAndPersist(ownerId, event.getGameweek());
                log.info("Recalculated points for user {} due to player update.", ownerId);
            } catch (Exception e) {
                log.error("Failed to update user points via event: {}", e.getMessage());
            }
        });
    }
}