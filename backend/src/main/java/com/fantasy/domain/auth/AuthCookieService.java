package com.fantasy.domain.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class AuthCookieService {

    public static final String SESSION_COOKIE_NAME = "fantasy_session";

    private final Duration sessionDuration;
    private final boolean secure;

    public AuthCookieService(
            @Value("${app.jwt.expiration-millis}") long expirationMillis,
            @Value("${app.auth.cookie-secure:false}") boolean secure) {
        this.sessionDuration = Duration.ofMillis(expirationMillis);
        this.secure = secure;
    }

    public ResponseCookie createSessionCookie(String token) {
        return baseCookie(token)
                .maxAge(sessionDuration)
                .build();
    }

    public ResponseCookie clearSessionCookie() {
        return baseCookie("")
                .maxAge(Duration.ZERO)
                .build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(SESSION_COOKIE_NAME, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/");
    }
}
