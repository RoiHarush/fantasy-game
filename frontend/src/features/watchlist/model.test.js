import { describe, expect, it } from "vitest";

import { updateWatchlist } from "./model";

describe("updateWatchlist", () => {
    it("adds a player only once", () => {
        const initial = [10, 20];

        expect(updateWatchlist(initial, 30, false)).toEqual([10, 20, 30]);
        expect(updateWatchlist(initial, 20, false)).toBe(initial);
    });

    it("removes every stale duplicate when a player is unwatched", () => {
        expect(updateWatchlist([10, 20, 20, 30], 20, true)).toEqual([10, 30]);
    });

    it("does not mutate the cached list", () => {
        const initial = [10, 20];

        updateWatchlist(initial, 30, false);

        expect(initial).toEqual([10, 20]);
    });
});
