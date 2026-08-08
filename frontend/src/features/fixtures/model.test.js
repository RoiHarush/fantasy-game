import { describe, expect, it } from "vitest";

import {
    getDefaultFixturesGameweek,
    getFixtureGameweekNavigation,
    groupFixturesByDay,
} from "./model";

const gameweeks = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe("fixtures model", () => {
    it("uses the next round by default and falls back to the final round after the season", () => {
        expect(getDefaultFixturesGameweek({ gameweeks, nextGameweek: { id: 2 } }).id).toBe(2);
        expect(getDefaultFixturesGameweek({ gameweeks, lastGameweek: { id: 3 } }).id).toBe(3);
    });

    it("removes navigation controls at the first and final rounds", () => {
        expect(getFixtureGameweekNavigation(gameweeks, 1)).toMatchObject({
            canGoPrevious: false,
            canGoNext: true,
        });
        expect(getFixtureGameweekNavigation(gameweeks, 3)).toMatchObject({
            canGoPrevious: true,
            canGoNext: false,
        });
    });

    it("groups fixtures using Jerusalem calendar days and sorts kickoffs", () => {
        const grouped = groupFixturesByDay([
            { id: 2, kickoff_time: "2026-08-21T19:00:00Z" },
            { id: 1, kickoff_time: "2026-08-21T18:00:00Z" },
        ]);

        expect(grouped).toHaveLength(1);
        expect(grouped[0].fixtures.map(({ id }) => id)).toEqual([1, 2]);
    });
});
