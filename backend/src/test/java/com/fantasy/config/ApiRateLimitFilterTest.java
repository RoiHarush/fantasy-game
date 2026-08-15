package com.fantasy.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

class ApiRateLimitFilterTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsRequestsAfterTheConfiguredCapacityAndReturnsRetryMetadata() throws Exception {
        ApiRateLimitFilter filter = new ApiRateLimitFilter(true, 2, 2, 2, Duration.ofMinutes(1));
        FilterChain chain = mock(FilterChain.class);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/players");
        request.setRemoteAddr("127.0.0.1");

        filter.doFilter(request, new MockHttpServletResponse(), chain);
        filter.doFilter(request, new MockHttpServletResponse(), chain);

        MockHttpServletResponse rejected = new MockHttpServletResponse();
        filter.doFilter(request, rejected, chain);

        assertThat(rejected.getStatus()).isEqualTo(429);
        assertThat(rejected.getHeader("Retry-After")).isNotBlank();
        assertThat(rejected.getContentAsString()).contains("RATE_LIMITED");
        verify(chain, times(2)).doFilter(eq(request), any());
    }

    @Test
    void keepsAuthenticatedUsersInSeparateBuckets() throws Exception {
        ApiRateLimitFilter filter = new ApiRateLimitFilter(true, 1, 1, 1, Duration.ofMinutes(1));
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/players");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(1, null, java.util.List.of()));
        filter.doFilter(request, new MockHttpServletResponse(), chain);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(2, null, java.util.List.of()));
        MockHttpServletResponse secondUser = new MockHttpServletResponse();
        filter.doFilter(request, secondUser, chain);

        assertThat(secondUser.getStatus()).isEqualTo(200);
        verify(chain, times(2)).doFilter(eq(request), any());
    }

    @Test
    void doesNotRateLimitWebSocketTraffic() throws Exception {
        ApiRateLimitFilter filter = new ApiRateLimitFilter(true, 1, 1, 1, Duration.ofMinutes(1));
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/ws/info");

        filter.doFilter(request, new MockHttpServletResponse(), chain);
        filter.doFilter(request, new MockHttpServletResponse(), chain);

        verify(chain, times(2)).doFilter(eq(request), any());
    }
}
