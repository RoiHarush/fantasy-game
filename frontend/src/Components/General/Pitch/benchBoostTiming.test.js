import { describe, expect, it } from "vitest";

import { BENCH_BOOST_CYCLE_SECONDS, getBenchImpactDelay } from "./benchBoostTiming";

describe("bench boost timing", () => {
    it("maps bench-player centers to increasing delays on the top border", () => {
        const delays = Array.from({ length: 4 }, (_, index) => getBenchImpactDelay(index, 4));

        expect(delays).toEqual([...delays].sort((left, right) => left - right));
        expect(delays[0]).toBeGreaterThan(0);
        expect(delays[3]).toBeLessThan(BENCH_BOOST_CYCLE_SECONDS);
    });

    it("returns no delay when the player count is invalid", () => {
        expect(getBenchImpactDelay(0, 0)).toBe(0);
    });
});
