package com.fantasy.api;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class WatchlistSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public WatchlistSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendWatchlistUpdate(int userId, List<Integer> watchlist) {
        messagingTemplate.convertAndSend("/topic/watchlist/" + userId, watchlist);
    }
}

