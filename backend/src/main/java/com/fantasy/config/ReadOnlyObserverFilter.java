package com.fantasy.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

final class ReadOnlyObserverFilter extends OncePerRequestFilter {
    static final String HEADER_NAME = "X-Fantasy-Observer-Mode";
    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");
    private static final Set<String> ALLOWED_MUTATIONS = Set.of("/api/auth/websocket-ticket");
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        boolean observerRequest = "read-only".equalsIgnoreCase(request.getHeader(HEADER_NAME));
        boolean unsafeMethod = !SAFE_METHODS.contains(request.getMethod());
        boolean allowedInfrastructureRequest = ALLOWED_MUTATIONS.contains(request.getRequestURI());

        if (observerRequest && unsafeMethod && !allowedInfrastructureRequest) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), Map.of(
                    "code", "READ_ONLY_OBSERVER",
                    "message", "This action is blocked while using the read-only league view."
            ));
            return;
        }

        filterChain.doFilter(request, response);
    }
}
