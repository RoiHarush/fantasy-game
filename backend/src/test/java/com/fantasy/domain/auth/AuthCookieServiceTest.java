package com.fantasy.domain.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fantasy.domain.user.UserDto;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthCookieServiceTest {

    @Test
    void createsAnHttpOnlySameSiteSessionCookie() {
        AuthCookieService service = new AuthCookieService(60_000, false);

        String cookie = service.createSessionCookie("signed-token").toString();

        assertTrue(cookie.contains("fantasy_session=signed-token"));
        assertTrue(cookie.contains("HttpOnly"));
        assertTrue(cookie.contains("SameSite=Lax"));
        assertTrue(cookie.contains("Path=/"));
    }

    @Test
    void clearsTheSessionCookieImmediately() {
        AuthCookieService service = new AuthCookieService(60_000, true);

        String cookie = service.clearSessionCookie().toString();

        assertTrue(cookie.contains("Max-Age=0"));
        assertTrue(cookie.contains("Secure"));
    }

    @Test
    void neverSerializesTheJwtIntoTheResponseBody() throws Exception {
        LoginResponse response = new LoginResponse("secret-token", new UserDto());

        String json = new ObjectMapper().writeValueAsString(response);

        assertFalse(json.contains("secret-token"));
        assertFalse(json.contains("\"token\""));
        assertTrue(json.contains("\"user\""));
    }
}
