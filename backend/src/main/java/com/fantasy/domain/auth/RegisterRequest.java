package com.fantasy.domain.auth;

public record RegisterRequest(
        String firstName,
        String lastName,
        String name,
        String username,
        String email,
        String password
) {
    public RegisterRequest(String firstName, String lastName, String name, String username, String password) {
        this(firstName, lastName, name, username, null, password);
    }

    public RegisterRequest(String name, String username, String password) {
        this(null, null, name, username, null, password);
    }

    public RegisterRequest(String name, String username, String email, String password) {
        this(null, null, name, username, email, password);
    }
}
