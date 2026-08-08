import { describe, expect, it } from "vitest";

import { derivePointsGameweekView } from "./model";

const gameweeks = Array.from({ length: 38 }, (_, index) => ({ id: index + 1 }));

describe("points gameweek navigation", () => {
    it("shows no points gameweek before the season begins", () => {
        const view = derivePointsGameweekView({
            gameweeks,
            currentGameweek: null,
            lastGameweek: null,
            nextGameweek: { id: 1, status: "UPCOMING" },
        });

        expect(view.preSeason).toBe(true);
        expect(view.effectiveGameweek).toBeNull();
    });

    it("does not expose previous on gameweek one or future gameweeks", () => {
        const currentGameweek = { id: 1, status: "LIVE" };
        const view = derivePointsGameweekView({ gameweeks, currentGameweek });

        expect(view.visibleGameweeks).toHaveLength(1);
        expect(view.canGoPrevious).toBe(false);
        expect(view.canGoNext).toBe(false);
        expect(view.isLive).toBe(true);
    });

    it("uses the last completed gameweek between rounds and after gameweek 38", () => {
        const lastGameweek = { id: 38, status: "FINISHED" };
        const view = derivePointsGameweekView({ gameweeks, lastGameweek });

        expect(view.effectiveGameweek).toBe(lastGameweek);
        expect(view.canGoPrevious).toBe(true);
        expect(view.canGoNext).toBe(false);
        expect(view.isLive).toBe(false);
    });

    it("allows navigation back and forward within already-visible rounds", () => {
        const view = derivePointsGameweekView({
            gameweeks,
            currentGameweek: { id: 5, status: "LIVE" },
            selectedGameweekId: 3,
        });

        expect(view.effectiveGameweek.id).toBe(3);
        expect(view.canGoPrevious).toBe(true);
        expect(view.canGoNext).toBe(true);
        expect(view.isLive).toBe(false);
    });
});
