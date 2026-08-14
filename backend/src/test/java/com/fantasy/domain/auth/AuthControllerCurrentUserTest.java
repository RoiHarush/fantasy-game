package com.fantasy.domain.auth;

import com.fantasy.domain.user.UserDto;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthControllerCurrentUserTest {

    private final AuthService authService = mock(AuthService.class);
    private final AuthCookieService authCookieService = mock(AuthCookieService.class);
    private final AuthController controller = new AuthController(authService, authCookieService);

    @Test
    void rejectsUnauthenticatedCurrentUserRequest() {
        when(authCookieService.clearSessionCookie()).thenReturn(
                org.springframework.http.ResponseCookie.from("fantasy_session", "").maxAge(0).build()
        );

        ResponseEntity<UserDto> response = controller.currentUser(null);

        assertEquals(401, response.getStatusCode().value());
        assertNull(response.getBody());
        assertTrue(response.getHeaders().getFirst("Set-Cookie").startsWith("fantasy_session=; Max-Age=0"));
    }

    @Test
    void clearsSessionWhenTokenReferencesDeletedUser() {
        when(authService.getCurrentUser(17))
                .thenThrow(new IllegalStateException("Authenticated user was not found"));
        when(authCookieService.clearSessionCookie()).thenReturn(
                org.springframework.http.ResponseCookie.from("fantasy_session", "").maxAge(0).build()
        );

        ResponseEntity<UserDto> response = controller.currentUser(17);

        assertEquals(401, response.getStatusCode().value());
        assertNull(response.getBody());
        assertTrue(response.getHeaders().getFirst("Set-Cookie").startsWith("fantasy_session=; Max-Age=0"));
        verify(authCookieService).clearSessionCookie();
    }

    @Test
    void returnsAuthoritativeNormalUser() {
        assertCurrentUser(11, "ROLE_USER", false);
    }

    @Test
    void returnsAuthoritativeLeagueAdmin() {
        assertCurrentUser(12, "ROLE_USER", true);
    }

    @Test
    void returnsAuthoritativeSuperAdmin() {
        assertCurrentUser(13, "ROLE_SUPER_ADMIN", false);
    }

    @Test
    void verificationCreatesAServerSession() {
        UserDto user = new UserDto();
        user.setId(21);
        user.setEmail("verified@example.com");
        EmailVerificationResponse verification = new EmailVerificationResponse(
                "verification-session-token",
                user,
                "Email verified. Your account is ready."
        );
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie
                .from("fantasy_session", "verification-session-token")
                .httpOnly(true)
                .path("/")
                .build();
        when(authService.verifyEmail(new TokenRequest("raw-verification-token"))).thenReturn(verification);
        when(authCookieService.createSessionCookie("verification-session-token")).thenReturn(cookie);

        ResponseEntity<?> response = controller.verifyEmail(new TokenRequest("raw-verification-token"));

        assertEquals(200, response.getStatusCode().value());
        assertSame(verification, response.getBody());
        assertTrue(response.getHeaders().getFirst("Set-Cookie").contains("fantasy_session=verification-session-token"));
    }

    private void assertCurrentUser(int userId, String role, boolean leagueAdmin) {
        UserDto expected = new UserDto();
        expected.setId(userId);
        expected.setRole(role);
        expected.setLeagueAdmin(leagueAdmin);
        when(authService.getCurrentUser(userId)).thenReturn(expected);

        ResponseEntity<UserDto> response = controller.currentUser(userId);

        assertEquals(200, response.getStatusCode().value());
        assertSame(expected, response.getBody());
        verify(authService).getCurrentUser(userId);
    }
}
