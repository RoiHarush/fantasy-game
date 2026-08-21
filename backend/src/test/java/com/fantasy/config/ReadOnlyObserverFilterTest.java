package com.fantasy.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class ReadOnlyObserverFilterTest {
    private final ReadOnlyObserverFilter filter = new ReadOnlyObserverFilter();

    @Test
    void rejectsMutationMarkedAsObserverTraffic() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/teams/17/save");
        request.addHeader(ReadOnlyObserverFilter.HEADER_NAME, "read-only");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("READ_ONLY_OBSERVER");
    }

    @Test
    void allowsDedicatedObserverReads() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/observe/leagues/4");
        request.addHeader(ReadOnlyObserverFilter.HEADER_NAME, "read-only");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isSameAs(request);
    }

    @Test
    void keepsWebsocketTicketAvailableForTheObserverShell() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/websocket-ticket");
        request.addHeader(ReadOnlyObserverFilter.HEADER_NAME, "read-only");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isSameAs(request);
    }
}
