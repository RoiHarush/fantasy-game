import { describe, expect, it } from "vitest";

import { BENCH_BOOST_CYCLE_SECONDS, getBenchImpactDelay } from "./benchBoostTiming";

describe("bench boost timing", () => {
    it("spaces player shocks across the cycle so they pop in sequence", () => {
        const delays = Array.from({ length: 4 }, (_, index) => getBenchImpactDelay(index, 4));

        expect(delays).toEqual([0, 1.15, 2.3, 3.45]);
        expect(delays[3]).toBeLessThan(BENCH_BOOST_CYCLE_SECONDS);
    });

    it("returns no delay when the player count is invalid", () => {
        expect(getBenchImpactDelay(0, 0)).toBe(0);
    });
});
