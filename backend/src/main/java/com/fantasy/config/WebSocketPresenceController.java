package com.fantasy.config;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class WebSocketPresenceController {

    private final WebSocketPresenceService presenceService;

    public WebSocketPresenceController(WebSocketPresenceService presenceService) {
        this.presenceService = presenceService;
    }

    @MessageMapping("/presence")
    public void report(@Payload PresenceMessage message,
                       SimpMessageHeaderAccessor headers,
                       Principal principal) {
        if (principal == null) return;
        presenceService.report(
                headers.getSessionId(),
                Integer.parseInt(principal.getName()),
                message.visible(),
                message.clientInstanceId(),
                message.page()
        );
    }
}
