import { describe, expect, it } from "vitest";

import {
    findActiveGameweek,
    findGameweekScheduleConflict,
} from "./availability";

describe("gameweek activity availability", () => {
    const gameweek = {
        id: 1,
        name: "Gameweek 1",
        status: "UPCOMING",
        calculated: false,
        firstKickoffTime: [2026, 8, 21, 22, 0],
        lastKickoffTime: [2026, 8, 24, 22, 0],
    };

    it("detects a live gameweek as an immediate-opening blocker", () => {
        const live = { ...gameweek, status: "LIVE" };
        expect(findActiveGameweek([live], live, 0)).toEqual(live);
    });

    it("does not block after the live gameweek was calculated", () => {
        const settled = { ...gameweek, status: "LIVE", calculated: true };
        expect(findActiveGameweek([settled], settled, Date.now())).toBeNull();
    });

    it("blocks a draft time inside the published gameweek interval", () => {
        expect(findGameweekScheduleConflict(
            [gameweek],
            "2026-08-22T12:00",
        )).toEqual(gameweek);
    });

    it("allows a draft time before kickoff and after settlement", () => {
        expect(findGameweekScheduleConflict([gameweek], "2026-08-21T20:00")).toBeNull();
        expect(findGameweekScheduleConflict([gameweek], "2026-08-25T02:00")).toBeNull();
    });
});
