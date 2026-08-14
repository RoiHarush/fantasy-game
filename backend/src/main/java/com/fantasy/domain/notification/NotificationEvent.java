package com.fantasy.domain.notification;

public record NotificationEvent(
        String eventId,
        String type,
        String title,
        String body,
        String url,
        NotificationAudiencePolicy policy
) {}
