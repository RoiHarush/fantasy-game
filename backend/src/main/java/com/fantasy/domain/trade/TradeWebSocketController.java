package com.fantasy.domain.trade;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class TradeWebSocketController {
    private final SimpMessagingTemplate messagingTemplate;

    public TradeWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendChanged(long leagueId, long offerId, String status) {
        messagingTemplate.convertAndSend(
                "/topic/leagues/" + leagueId + "/trades",
                Map.of("event", "trade_changed", "leagueId", leagueId, "offerId", offerId, "status", status)
        );
    }
}

