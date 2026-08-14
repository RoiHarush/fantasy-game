package com.fantasy.domain.notification;

import java.util.Map;

public record PushSubscriptionRequest(
        String endpoint,
        Long expirationTime,
        Map<String, String> keys,
        String clientInstanceId
) {
    public String p256dh() { return keys == null ? null : keys.get("p256dh"); }
    public String auth() { return keys == null ? null : keys.get("auth"); }
}
