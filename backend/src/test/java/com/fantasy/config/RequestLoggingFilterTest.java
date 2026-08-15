package com.fantasy.config;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

class RequestLoggingFilterTest {

    private final RequestLoggingFilter filter = new RequestLoggingFilter();

    @Test
    void reusesRenderRequestIdAndClearsMdcAfterRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/gameweeks");
        request.addHeader("Rndr-Id", "rndr-123");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> {
            assertEquals("rndr-123", MDC.get("requestId"));
            response.setStatus(200);
        });

        assertEquals("rndr-123", response.getHeader(RequestLoggingFilter.REQUEST_ID_HEADER));
        assertNull(MDC.get("requestId"));
    }

    @Test
    void rejectsUnsafeIncomingRequestIdAndGeneratesANewOne() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.addHeader(RequestLoggingFilter.REQUEST_ID_HEADER, "unsafe\nvalue");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, (ignoredRequest, ignoredResponse) -> response.setStatus(401));

        String generated = response.getHeader(RequestLoggingFilter.REQUEST_ID_HEADER);
        assertFalse(generated == null || generated.isBlank());
        assertFalse(generated.contains("\n"));
        assertNull(MDC.get("requestId"));
    }
}
