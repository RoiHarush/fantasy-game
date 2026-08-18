package com.fantasy.domain.auth;

public record WebSocketTicketResponse(String ticket, long expiresInMillis) {
}
