package com.fantasy.domain.transfer;

import com.fantasy.config.UserPresenceChangedEvent;
import com.fantasy.domain.league.LeagueRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TransferPresenceEventHandlerTest {

    @Test
    void broadcastsPresenceToEveryLeagueContainingTheUser() {
        LeagueRepository leagueRepository = mock(LeagueRepository.class);
        TransferWebSocketController webSocketController = mock(TransferWebSocketController.class);
        TransferPresenceEventHandler handler = new TransferPresenceEventHandler(
                leagueRepository,
                webSocketController
        );
        when(leagueRepository.findIdsByUserId(7)).thenReturn(List.of(11L));

        handler.presenceChanged(new UserPresenceChangedEvent(7, true, false));

        verify(webSocketController).sendPresenceChangedEvent(11L, 7, true, false);
    }
}
