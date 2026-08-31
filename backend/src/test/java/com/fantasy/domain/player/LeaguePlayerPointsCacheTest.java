package com.fantasy.domain.player;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LeaguePlayerPointsCacheTest {

    @Test
    void reusesSnapshotUntilExpiryAndReloadsAfterInvalidation() {
        MutableClock clock = new MutableClock(Instant.parse("2026-08-31T08:00:00Z"));
        LeaguePlayerPointsCache cache = new LeaguePlayerPointsCache(Duration.ofSeconds(15), 10, clock);
        AtomicInteger loads = new AtomicInteger();

        assertEquals(Map.of(7, 1), cache.getOrLoad(12L, () -> Map.of(7, loads.incrementAndGet())));
        assertEquals(Map.of(7, 1), cache.getOrLoad(12L, () -> Map.of(7, loads.incrementAndGet())));
        assertEquals(1, loads.get());

        clock.advance(Duration.ofSeconds(15));
        assertEquals(Map.of(7, 2), cache.getOrLoad(12L, () -> Map.of(7, loads.incrementAndGet())));

        cache.invalidateLeague(12L);
        assertEquals(Map.of(7, 3), cache.getOrLoad(12L, () -> Map.of(7, loads.incrementAndGet())));
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
