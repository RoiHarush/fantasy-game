package com.fantasy.domain.auth;

public record ResetPasswordRequest(String token, String password) {
}
