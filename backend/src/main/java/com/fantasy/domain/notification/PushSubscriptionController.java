package com.fantasy.domain.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications/push")
public class PushSubscriptionController {
    private final PushSubscriptionService service;
    private final String publicKey;

    public PushSubscriptionController(
            PushSubscriptionService service,
            @Value("${app.web-push.vapid.public-key:}") String publicKey) {
        this.service = service;
        this.publicKey = publicKey;
    }

    @GetMapping("/public-key")
    public ResponseEntity<?> publicKey() {
        if (publicKey == null || publicKey.isBlank()) {
            return ResponseEntity.status(503).body(Map.of("message", "Push notifications are not configured"));
        }
        return ResponseEntity.ok(Map.of("publicKey", publicKey));
    }

    @PutMapping("/subscriptions")
    public ResponseEntity<Void> subscribe(@RequestBody PushSubscriptionRequest request,
                                          Authentication authentication) {
        service.upsert(Integer.parseInt(authentication.getName()), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/subscriptions")
    public ResponseEntity<Void> unsubscribe(@RequestBody Map<String, String> request,
                                            Authentication authentication) {
        service.remove(Integer.parseInt(authentication.getName()), request.get("endpoint"));
        return ResponseEntity.noContent().build();
    }
}
