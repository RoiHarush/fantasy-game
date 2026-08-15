package com.fantasy.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Adds one correlation id to every API request and records the outcome without
 * logging request bodies, query strings, cookies or authorization values.
 * Render's request id is reused when available so dashboard request logs and
 * application logs can be searched together.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String RENDER_REQUEST_ID_HEADER = "Rndr-Id";
    private static final int MAX_REQUEST_ID_LENGTH = 128;
    private static final Pattern SAFE_REQUEST_ID = Pattern.compile("[A-Za-z0-9._:-]+");
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/")
                || path.startsWith("/api/auth/csrf")
                || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestId = resolveRequestId(request);
        long startedAt = System.nanoTime();
        Throwable failure = null;

        response.setHeader(REQUEST_ID_HEADER, requestId);
        MDC.put("requestId", requestId);

        try {
            filterChain.doFilter(request, response);
        } catch (ServletException | IOException | RuntimeException exception) {
            failure = exception;
            throw exception;
        } finally {
            long durationMillis = (System.nanoTime() - startedAt) / 1_000_000;
            logOutcome(request, response, durationMillis, failure);
            MDC.remove("requestId");
        }
    }

    private void logOutcome(HttpServletRequest request,
                            HttpServletResponse response,
                            long durationMillis,
                            Throwable failure) {
        int status = response.getStatus();
        String method = request.getMethod();
        String path = request.getRequestURI();

        if (failure != null || status >= 500) {
            log.error("HTTP request failed: method={}, path={}, status={}, durationMs={}",
                    method, path, status, durationMillis, failure);
        } else if (status >= 400) {
            log.warn("HTTP request rejected: method={}, path={}, status={}, durationMs={}",
                    method, path, status, durationMillis);
        } else {
            log.info("HTTP request completed: method={}, path={}, status={}, durationMs={}",
                    method, path, status, durationMillis);
        }
    }

    private String resolveRequestId(HttpServletRequest request) {
        String renderId = normalizedHeader(request.getHeader(RENDER_REQUEST_ID_HEADER));
        if (renderId != null) return renderId;

        String clientId = normalizedHeader(request.getHeader(REQUEST_ID_HEADER));
        if (clientId != null) return clientId;

        return UUID.randomUUID().toString();
    }

    private String normalizedHeader(String value) {
        if (value == null) return null;

        String candidate = value.trim();
        if (candidate.isEmpty()
                || candidate.length() > MAX_REQUEST_ID_LENGTH
                || !SAFE_REQUEST_ID.matcher(candidate).matches()) {
            return null;
        }
        return candidate;
    }
}
