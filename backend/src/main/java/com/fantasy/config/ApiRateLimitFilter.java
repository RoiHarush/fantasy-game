package com.fantasy.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * A deliberately generous, per-instance API guardrail. It protects the small
 * league application from accidental request loops and button spam without
 * throttling WebSocket traffic or scheduled backend work.
 */
@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private static final Duration STALE_BUCKET_AGE = Duration.ofMinutes(15);
    private static final long CLEANUP_INTERVAL = 256;

    private final boolean enabled;
    private final int readCapacity;
    private final int writeCapacity;
    private final int authCapacity;
    private final long windowNanos;
    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong();

    public ApiRateLimitFilter(
            @Value("${app.rate-limit.enabled:true}") boolean enabled,
            @Value("${app.rate-limit.read-capacity:600}") int readCapacity,
            @Value("${app.rate-limit.write-capacity:120}") int writeCapacity,
            @Value("${app.rate-limit.auth-capacity:30}") int authCapacity,
            @Value("${app.rate-limit.window:60s}") Duration window) {
        this.enabled = enabled;
        this.readCapacity = requirePositive(readCapacity, "read capacity");
        this.writeCapacity = requirePositive(writeCapacity, "write capacity");
        this.authCapacity = requirePositive(authCapacity, "auth capacity");
        this.windowNanos = requirePositive(window.toNanos(), "window");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !enabled || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        LimitGroup group = classify(request);
        int capacity = capacityFor(group);
        long now = System.nanoTime();
        String key = group.name() + ':' + clientKey(request);
        TokenBucket bucket = buckets.computeIfAbsent(key, ignored -> new TokenBucket(capacity, now));
        Decision decision = bucket.tryConsume(capacity, windowNanos, now);

        response.setHeader("X-RateLimit-Limit", Integer.toString(capacity));
        response.setHeader("X-RateLimit-Remaining", Integer.toString(decision.remaining()));

        cleanupOccasionally(now);

        if (!decision.allowed()) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", Long.toString(decision.retryAfterSeconds()));
            response.setHeader("Cache-Control", "no-store");
            response.getWriter().write("{\"code\":\"RATE_LIMITED\",\"error\":\"Too many requests. Please wait a moment and try again.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private LimitGroup classify(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/") && !"GET".equalsIgnoreCase(request.getMethod())) {
            return LimitGroup.AUTH;
        }
        if ("GET".equalsIgnoreCase(request.getMethod()) || "HEAD".equalsIgnoreCase(request.getMethod())) {
            return LimitGroup.READ;
        }
        return LimitGroup.WRITE;
    }

    private int capacityFor(LimitGroup group) {
        return switch (group) {
            case READ -> readCapacity;
            case WRITE -> writeCapacity;
            case AUTH -> authCapacity;
        };
    }

    private String clientKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() != null) {
            return "user:" + authentication.getPrincipal();
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return "ip:" + forwardedFor.split(",", 2)[0].trim();
        }
        return "ip:" + request.getRemoteAddr();
    }

    private void cleanupOccasionally(long now) {
        if (requestCounter.incrementAndGet() % CLEANUP_INTERVAL != 0) return;

        long staleBefore = now - STALE_BUCKET_AGE.toNanos();
        buckets.entrySet().removeIf(entry -> entry.getValue().lastSeenNanos() < staleBefore);
    }

    private static int requirePositive(int value, String name) {
        if (value <= 0) throw new IllegalArgumentException("Rate-limit " + name + " must be positive");
        return value;
    }

    private static long requirePositive(long value, String name) {
        if (value <= 0) throw new IllegalArgumentException("Rate-limit " + name + " must be positive");
        return value;
    }

    private enum LimitGroup {
        READ,
        WRITE,
        AUTH
    }

    private record Decision(boolean allowed, int remaining, long retryAfterSeconds) {
    }

    private static final class TokenBucket {
        private double tokens;
        private long lastRefillNanos;
        private long lastSeenNanos;

        private TokenBucket(int capacity, long now) {
            this.tokens = capacity;
            this.lastRefillNanos = now;
            this.lastSeenNanos = now;
        }

        private synchronized Decision tryConsume(int capacity, long windowNanos, long now) {
            long elapsed = Math.max(0, now - lastRefillNanos);
            if (elapsed > 0) {
                tokens = Math.min(capacity, tokens + ((double) elapsed * capacity / windowNanos));
                lastRefillNanos = now;
            }
            lastSeenNanos = now;

            if (tokens >= 1) {
                tokens -= 1;
                return new Decision(true, (int) Math.floor(tokens), 0);
            }

            double tokensNeeded = 1 - tokens;
            long retryNanos = (long) Math.ceil(tokensNeeded * windowNanos / capacity);
            long retrySeconds = Math.max(1, (long) Math.ceil(retryNanos / 1_000_000_000d));
            return new Decision(false, 0, retrySeconds);
        }

        private synchronized long lastSeenNanos() {
            return lastSeenNanos;
        }
    }
}
