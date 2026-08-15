package com.fantasy.domain.transfer;

import com.fantasy.config.UserPresenceChangedEvent;
import com.fantasy.domain.league.LeagueRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class TransferPresenceEventHandler {

    private final LeagueRepository leagueRepository;
    private final TransferWebSocketController webSocketController;

    public TransferPresenceEventHandler(LeagueRepository leagueRepository,
                                        TransferWebSocketController webSocketController) {
        this.leagueRepository = leagueRepository;
        this.webSocketController = webSocketController;
    }

    @EventListener
    public void presenceChanged(UserPresenceChangedEvent event) {
        leagueRepository.findIdsByUserId(event.userId()).forEach(leagueId ->
                webSocketController.sendPresenceChangedEvent(
                        leagueId,
                        event.userId(),
                        event.online(),
                        event.active()
                )
        );
    }
}
