package com.fantasy.domain.auth;

public record RegisterRequest(
        String firstName,
        String lastName,
        String name,
        String username,
        String password
) {
    public RegisterRequest(String name, String username, String password) {
        this(null, null, name, username, password);
    }
}
