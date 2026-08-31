package com.fantasy.domain.player;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Keeps the expensive, league-specific season totals out of the request hot path.
 *
 * <p>The cached value contains only player ids and calculated point totals. Player
 * ownership, availability, injuries and transfer-window state are deliberately
 * resolved for every request so live game behaviour is never cached.</p>
 */
@Component
public class LeaguePlayerPointsCache {

    private static final int DEFAULT_MAX_ENTRIES = 100;
    private static final int LOCK_STRIPES = 16;

    private final Duration ttl;
    private final int maxEntries;
    private final Clock clock;
    private final Map<Long, CacheEntry> entries = new ConcurrentHashMap<>();
    private final Object[] locks = new Object[LOCK_STRIPES];

    @Autowired
    public LeaguePlayerPointsCache(
            @Value("${app.players.league-points-cache-ttl:15s}") Duration ttl) {
        this(ttl, DEFAULT_MAX_ENTRIES, Clock.systemUTC());
    }

    LeaguePlayerPointsCache(Duration ttl, int maxEntries, Clock clock) {
        if (ttl.isNegative() || ttl.isZero()) {
            throw new IllegalArgumentException("Player points cache TTL must be positive");
        }
        if (maxEntries < 1) {
            throw new IllegalArgumentException("Player points cache size must be positive");
        }
        this.ttl = ttl;
        this.maxEntries = maxEntries;
        this.clock = clock;
        for (int index = 0; index < locks.length; index++) {
            locks[index] = new Object();
        }
    }

    public Map<Integer, Integer> getOrLoad(long leagueId,
                                           Supplier<Map<Integer, Integer>> loader) {
        Instant now = clock.instant();
        CacheEntry current = entries.get(leagueId);
        if (isUsable(current, now)) {
            return current.points();
        }

        Object lock = locks[Math.floorMod(Long.hashCode(leagueId), locks.length)];
        synchronized (lock) {
            now = clock.instant();
            current = entries.get(leagueId);
            if (isUsable(current, now)) {
                return current.points();
            }

            Map<Integer, Integer> loaded = Map.copyOf(loader.get());
            pruneIfNeeded(now, leagueId);
            entries.put(leagueId, new CacheEntry(loaded, now.plus(ttl), now));
            return loaded;
        }
    }

    public void invalidateLeague(long leagueId) {
        entries.remove(leagueId);
    }

    public void invalidateAll() {
        entries.clear();
    }

    private boolean isUsable(CacheEntry entry, Instant now) {
        return entry != null && now.isBefore(entry.expiresAt());
    }

    private void pruneIfNeeded(Instant now, long incomingLeagueId) {
        entries.entrySet().removeIf(entry -> !isUsable(entry.getValue(), now));
        if (entries.size() < maxEntries || entries.containsKey(incomingLeagueId)) {
            return;
        }
        entries.entrySet().stream()
                .min(Comparator.comparing(entry -> entry.getValue().createdAt()))
                .ifPresent(entry -> entries.remove(entry.getKey(), entry.getValue()));
    }

    private record CacheEntry(Map<Integer, Integer> points,
                              Instant expiresAt,
                              Instant createdAt) {}
}
