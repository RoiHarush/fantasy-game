package com.fantasy.domain.auth.mail;

public record OutboundEmail(
        String to,
        String subject,
        String html,
        String text,
        String idempotencyKey
) {
}
