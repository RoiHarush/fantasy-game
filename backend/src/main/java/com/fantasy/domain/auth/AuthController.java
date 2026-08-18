package com.fantasy.domain.auth;

import com.fantasy.domain.user.UserDto;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    public AuthController(AuthService authService, AuthCookieService authCookieService) {
        this.authService = authService;
        this.authCookieService = authCookieService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            LoginResponse response = authService.login(req);
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, authCookieService.createSessionCookie(response.token).toString())
                    .body(response);
        } catch (EmailVerificationRequiredException exception) {
            return ResponseEntity.status(403).body(Map.of(
                    "message", exception.getMessage(),
                    "code", "EMAIL_NOT_VERIFIED",
                    "email", exception.getEmail()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            return ResponseEntity.status(201).body(authService.register(request));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody TokenRequest request) {
        try {
            EmailVerificationResponse response = authService.verifyEmail(request);
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, authCookieService.createSessionCookie(response.token()).toString())
                    .body(response);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody ResendVerificationRequest request) {
        return authAction(() -> authService.resendVerification(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        return authAction(() -> authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        return authAction(() -> authService.resetPassword(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookieService.clearSessionCookie().toString())
                .body("Logged out successfully");
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken csrfToken) {
        return Map.of("token", csrfToken.getToken());
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> currentUser(@AuthenticationPrincipal Integer userId) {
        if (userId == null) {
            return expiredSessionResponse();
        }

        try {
            return ResponseEntity.ok(authService.getCurrentUser(userId));
        } catch (IllegalStateException exception) {
            // A signed token can outlive its database user after a seasonal reset.
            // Treat that token as an expired session and remove it from the browser.
            return expiredSessionResponse();
        }
    }

    @PostMapping("/websocket-ticket")
    public ResponseEntity<WebSocketTicketResponse> webSocketTicket(
            @AuthenticationPrincipal Integer userId) {
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(authService.issueWebSocketTicket(userId));
    }

    private ResponseEntity<UserDto> expiredSessionResponse() {
        return ResponseEntity.status(401)
                .header(HttpHeaders.SET_COOKIE, authCookieService.clearSessionCookie().toString())
                .build();
    }

    private ResponseEntity<?> authAction(java.util.function.Supplier<AuthMessageResponse> action) {
        try {
            return ResponseEntity.ok(action.get());
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
        }
    }
}
