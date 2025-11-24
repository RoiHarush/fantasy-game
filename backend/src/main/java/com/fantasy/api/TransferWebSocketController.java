package com.fantasy.api;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class TransferWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public TransferWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendWindowOpenedEvent(
            int firstUserId,
            List<Integer> initialOrder,
            List<Integer> turnOrder,
            Map<Integer, Integer> turnsUsed,
            Map<Integer, Integer> totalTurns
    ) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "window_opened");
        event.put("userId", firstUserId);
        event.put("initialOrder", initialOrder);
        event.put("turnOrder", turnOrder);
        event.put("turnsUsed", turnsUsed);
        event.put("totalTurns", totalTurns); // <---
        messagingTemplate.convertAndSend("/topic/transfers", event);
    }


    public void sendTransferDoneEvent(int userId, int playerOutId, int playerInId, String userName) {
        messagingTemplate.convertAndSend("/topic/transfers",
                new TransferEvent("transfer_done", userId, playerOutId, playerInId, userName));
    }

    public void sendTransferDoneEvent(int userId, Integer playerInId, String userName) {
        messagingTemplate.convertAndSend("/topic/transfers",
                new TransferEvent("transfer_done", userId, null, playerInId, userName));
    }

    public void sendTurnStartedEvent(
            int userId,
            List<Integer> turnOrder,
            String roundType,
            Map<Integer, Integer> turnsUsed
    ) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "turn_started");
        event.put("userId", userId);
        event.put("turnOrder", turnOrder);
        event.put("roundType", roundType);
        event.put("turnsUsed", turnsUsed);
        messagingTemplate.convertAndSend("/topic/transfers", event);
    }

    public void sendIRTurnStartedEvent(int userId, String irPosition, List<Integer> turnOrder, Map<Integer, Integer> turnsUsed) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "ir_round_started");
        event.put("userId", userId);
        event.put("irPosition", irPosition);
        event.put("turnOrder", turnOrder);
        event.put("turnsUsed", turnsUsed);
        messagingTemplate.convertAndSend("/topic/transfers", event);
    }

    public void sendTurnStartedEvent(int userId, List<Integer> turnOrder) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "turn_started");
        event.put("userId", userId);
        event.put("turnOrder", turnOrder);
        messagingTemplate.convertAndSend("/topic/transfers", event);
    }

    public void sendIRTurnStartedEvent(int userId, String irPosition, List<Integer> turnOrder) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "ir_round_started");
        event.put("userId", userId);
        event.put("irPosition", irPosition);
        event.put("turnOrder", turnOrder);
        messagingTemplate.convertAndSend("/topic/transfers", event);
    }

    public void sendPassEvent(int userId, String userName) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "turn_passed");
        event.put("userId", userId);
        event.put("userName", userName);
        messagingTemplate.convertAndSend("/topic/transfers", event);
    }

    public void sendWindowClosedEvent() {
        messagingTemplate.convertAndSend("/topic/transfers",
                new TransferEvent("window_closed"));
    }

    public void sendInfoMessage(int userId, String message) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "info_message");
        event.put("userId", userId);
        event.put("message", message);
        messagingTemplate.convertAndSend("/topic/transfers", event);
    }

    public record TransferEvent(
            String event,
            Integer userId,
            Integer playerOutId,
            Integer playerInId,
            String userName
    ) {
        public TransferEvent(String event, Integer userId, Integer playerOutId, Integer playerInId) {
            this(event, userId, playerOutId, playerInId, null);
        }

        public TransferEvent(String event, Integer userId) {
            this(event, userId, null, null, null);
        }

        public TransferEvent(String event) {
            this(event, null, null, null, null);
        }
    }
}
