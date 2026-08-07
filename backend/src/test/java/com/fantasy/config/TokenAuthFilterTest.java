package com.fantasy.config;

import com.fantasy.domain.auth.AuthCookieService;
import com.fantasy.domain.auth.JwtService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TokenAuthFilterTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesARequestFromTheHttpOnlySessionCookie() throws Exception {
        JwtService jwtService = mock(JwtService.class);
        when(jwtService.isTokenValid("cookie-token")).thenReturn(true);
        when(jwtService.extractUserId("cookie-token")).thenReturn(17);
        when(jwtService.extractRole("cookie-token")).thenReturn("ROLE_USER");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(AuthCookieService.SESSION_COOKIE_NAME, "cookie-token"));

        new TokenAuthFilter(jwtService).doFilter(
                request,
                new MockHttpServletResponse(),
                new MockFilterChain()
        );

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("17", SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
