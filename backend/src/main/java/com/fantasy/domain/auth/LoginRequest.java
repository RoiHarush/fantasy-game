package com.fantasy.domain.auth;

public record LoginRequest(String identifier, String username, String password) {
    public LoginRequest(String username, String password) {
        this(null, username, password);
    }

    public String resolvedIdentifier() {
        return identifier == null || identifier.isBlank() ? username : identifier;
    }
}
