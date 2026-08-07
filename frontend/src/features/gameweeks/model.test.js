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
