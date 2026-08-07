import { describe, expect, it } from "vitest";

import { queryKeys } from "./keys";

describe("queryKeys", () => {
    it("isolates league-scoped player caches", () => {
        expect(queryKeys.players(1)).not.toEqual(queryKeys.players(2));
    });

    it("isolates user watchlists inside the same league", () => {
        expect(queryKeys.watchlist(10, 1)).not.toEqual(queryKeys.watchlist(11, 1));
    });

    it("separates live points from finalized points", () => {
        expect(queryKeys.pointsPage(10, 4, true)).not.toEqual(queryKeys.pointsPage(10, 4, false));
    });
});
