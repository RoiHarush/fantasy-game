import { describe, expect, it } from "vitest";

import { normalizeGameweekResponses } from "./model";

const fulfilled = (value) => ({ status: "fulfilled", value });
const rejected = (reason) => ({ status: "rejected", reason });

describe("normalizeGameweekResponses", () => {
    it("sorts the season and preserves the current boundaries", () => {
        const state = normalizeGameweekResponses([
            fulfilled([{ id: 3 }, { id: 1 }, { id: 2 }]),
            fulfilled({ id: 1 }),
            fulfilled({ id: 2 }),
            fulfilled({ id: 38 }),
        ]);

        expect(state.gameweeks.map(({ id }) => id)).toEqual([1, 2, 3]);
        expect(state.currentGameweek).toEqual({ id: 1 });
        expect(state.nextGameweek).toEqual({ id: 2 });
        expect(state.lastGameweek).toEqual({ id: 38 });
    });

    it("uses null when an optional gameweek endpoint has no value", () => {
        const state = normalizeGameweekResponses([
            fulfilled([{ id: 1 }]),
            rejected(new Error("season has not started")),
            fulfilled({ id: 1 }),
            fulfilled({ id: 38 }),
        ]);

        expect(state.currentGameweek).toBeNull();
    });

    it("recovers the upcoming gameweek from the season list when the boundary request is stale", () => {
        const upcoming = { id: 1, status: "UPCOMING" };
        const state = normalizeGameweekResponses([
            fulfilled([upcoming, { id: 2, status: "UPCOMING" }]),
            fulfilled(null),
            fulfilled(null),
            fulfilled(null),
        ]);

        expect(state.nextGameweek).toEqual(upcoming);
    });

    it("treats Spring's empty 200 boundary responses as missing before the season", () => {
        const upcoming = { id: 1, status: "UPCOMING" };
        const state = normalizeGameweekResponses([
            fulfilled([upcoming, { id: 2, status: "UPCOMING" }]),
            fulfilled(""),
            fulfilled(upcoming),
            fulfilled(""),
        ]);

        expect(state.currentGameweek).toBeNull();
        expect(state.nextGameweek).toEqual(upcoming);
        expect(state.lastGameweek).toBeNull();
    });

    it("fails when the season gameweek list cannot be loaded", () => {
        const error = new Error("gameweeks unavailable");

        expect(() => normalizeGameweekResponses([
            rejected(error),
            fulfilled(null),
            fulfilled(null),
            fulfilled(null),
        ])).toThrow(error);
    });
});
