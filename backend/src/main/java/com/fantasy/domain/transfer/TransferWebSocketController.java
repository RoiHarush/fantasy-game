package com.fantasy.domain.transfer;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

@Controller
public class TransferWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public TransferWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendWindowOpenedEvent(long leagueId,
                                      int firstUserId,
                                      List<Integer> initialOrder,
                                      List<Integer> canonicalOrder,
                                      List<Integer> turnOrder,
                                      Map<Integer, Integer> turnsUsed,
                                      Map<Integer, Integer> totalTurns,
                                      TransferWindowType windowType) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "window_opened");
        event.put("leagueId", leagueId);
        event.put("userId", firstUserId);
        event.put("initialOrder", initialOrder);
        event.put("canonicalOrder", canonicalOrder);
        event.put("turnOrder", turnOrder);
        event.put("turnsUsed", turnsUsed);
        event.put("totalTurns", totalTurns);
        event.put("isDraftMode", windowType != TransferWindowType.TRANSFER);
        event.put("draftType", windowType == TransferWindowType.DRAFT
                ? DraftType.INITIAL.name()
                : windowType == TransferWindowType.SUPPLEMENTAL
                    ? DraftType.SUPPLEMENTAL.name()
                    : null);
        send(leagueId, event);
    }

    public void sendTransferDoneEvent(long leagueId,
                                      int userId,
                                      int playerOutId,
                                      int playerInId,
                                      String userName) {
        send(leagueId, new TransferEvent(
                "transfer_done",
                leagueId,
                userId,
                playerOutId,
                playerInId,
                userName
        ));
    }

    public void sendTransferDoneEvent(long leagueId, int userId, Integer playerInId, String userName) {
        send(leagueId, new TransferEvent(
                "transfer_done",
                leagueId,
                userId,
                null,
                playerInId,
                userName
        ));
    }

    public void sendTurnStartedEvent(long leagueId,
                                     int userId,
                                     List<Integer> turnOrder,
                                     String roundType,
                                     Map<Integer, Integer> turnsUsed) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "turn_started");
        event.put("leagueId", leagueId);
        event.put("userId", userId);
        event.put("turnOrder", turnOrder);
        event.put("roundType", roundType);
        event.put("turnsUsed", turnsUsed);
        send(leagueId, event);
    }

    public void sendIRTurnStartedEvent(long leagueId,
                                       int userId,
                                       String irPosition,
                                       List<Integer> turnOrder,
                                       Map<Integer, Integer> turnsUsed) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "ir_round_started");
        event.put("leagueId", leagueId);
        event.put("userId", userId);
        event.put("irPosition", irPosition);
        event.put("turnOrder", turnOrder);
        event.put("turnsUsed", turnsUsed);
        send(leagueId, event);
    }

    public void sendPassEvent(long leagueId, int userId, String userName) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "turn_passed");
        event.put("leagueId", leagueId);
        event.put("userId", userId);
        event.put("userName", userName);
        send(leagueId, event);
    }

    public void sendWindowClosedEvent(long leagueId) {
        send(leagueId, new TransferEvent("window_closed", leagueId, null, null, null, null));
    }

    public void sendDraftScheduledEvent(long leagueId,
                                        LocalDateTime scheduledTime,
                                        DraftType draftType) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "draft_scheduled");
        event.put("leagueId", leagueId);
        event.put("scheduledTime", scheduledTime);
        event.put("draftType", draftType.name());
        send(leagueId, event);
    }

    public void sendDraftCancelledEvent(long leagueId, DraftType draftType) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "draft_cancelled");
        event.put("leagueId", leagueId);
        event.put("draftType", draftType.name());
        send(leagueId, event);
    }

    public void sendInfoMessage(long leagueId, int userId, String message) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "info_message");
        event.put("leagueId", leagueId);
        event.put("userId", userId);
        event.put("message", message);
        send(leagueId, event);
    }

    private void send(long leagueId, Object event) {
        messagingTemplate.convertAndSend("/topic/leagues/" + leagueId + "/transfers", event);
    }

    public record TransferEvent(
            String event,
            Long leagueId,
            Integer userId,
            Integer playerOutId,
            Integer playerInId,
            String userName
    ) {}
}
