package com.fantasy.application;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class SystemStatusService {

    private final AtomicBoolean isRolloverInProgress = new AtomicBoolean(false);
    private final SimpMessagingTemplate messagingTemplate;

    public SystemStatusService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void setRolloverInProgress(boolean status) {
        this.isRolloverInProgress.set(status);

        String statusStr = status ? "LOCKED" : "UNLOCKED";

        messagingTemplate.convertAndSend("/topic/system-status", Map.of("status", statusStr));

        System.out.println("System status changed to: " + statusStr + ". Notification sent.");
    }

    public boolean isRolloverInProgress() {
        return isRolloverInProgress.get();
    }
}
