import { describe, expect, it } from "vitest";

import {
    deriveStatusGameweekView,
    getCountdownParts,
    getRankLabel,
    getUpcomingDeadline,
    getVisibleCountdownUnits,
    splitTransferActions,
    getIrTransferSourceLabel,
} from "./model";

describe("status model", () => {
    it("identifies the state before gameweek one", () => {
        const nextGameweek = { id: 1, status: "UPCOMING" };
        expect(deriveStatusGameweekView({ currentGameweek: null, nextGameweek, lastGameweek: null })).toMatchObject({
            displayedGameweek: nextGameweek,
            preSeason: true,
            seasonComplete: false,
            transferHistoryGameweekId: 1,
        });
    });

    it("uses the full schedule when cached boundary fields are empty", () => {
        const nextGameweek = { id: 1, status: "UPCOMING" };

        expect(deriveStatusGameweekView({
            gameweeks: [nextGameweek, { id: 2, status: "UPCOMING" }],
            currentGameweek: null,
            nextGameweek: null,
            lastGameweek: null,
        })).toMatchObject({
            displayedGameweek: nextGameweek,
            preSeason: true,
            transferHistoryGameweekId: 1,
        });
    });

    it("uses the final gameweek instead of loading forever after the season", () => {
        const lastGameweek = { id: 38, status: "FINISHED" };
        expect(deriveStatusGameweekView({ currentGameweek: null, nextGameweek: null, lastGameweek })).toMatchObject({
            displayedGameweek: lastGameweek,
            seasonComplete: true,
        });
    });

    it("formats ordinal ranks including teen exceptions", () => {
        expect([1, 2, 3, 4, 11, 12, 13, 21].map(getRankLabel)).toEqual([
            "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st",
        ]);
    });

    it("keeps transfer history in action order and separates IR moves", () => {
        const split = splitTransferActions([
            { id: 3, userId: 7, source: "MANUAL" },
            { id: 1, userId: 8, source: "WAIVER" },
            { id: 2, userId: 7, source: "IR_WAIVER" },
        ]);
        expect(split.regular.map(({ id }) => id)).toEqual([1, 3]);
        expect(split.ir.map(({ id }) => id)).toEqual([2]);
        expect(getIrTransferSourceLabel(split.ir[0].source)).toBe("Waiver");
    });

    it("moves the single countdown from the transfer window to lineup lock", () => {
        const deadlines = { transferWindow: 2_000, lineupLock: 6_500 };

        expect(getUpcomingDeadline(deadlines, 1_000)).toMatchObject({ kind: "transfer-window", targetTime: 2_000 });
        expect(getUpcomingDeadline(deadlines, 2_000)).toMatchObject({ kind: "lineup-lock", targetTime: 6_500 });
        expect(getUpcomingDeadline(deadlines, 6_500)).toBeNull();
    });

    it("splits the remaining duration without displaying zero too early", () => {
        expect(getCountdownParts(90_061_001, 1_000)).toEqual({
            days: 1,
            hours: 1,
            minutes: 1,
            seconds: 1,
        });
        expect(getCountdownParts(1_001, 1_000).seconds).toBe(1);
    });

    it("only shows seconds during the final hour", () => {
        expect(getVisibleCountdownUnits({ days: 2, hours: 3 })).toEqual([
            ["days", "d"], ["hours", "h"], ["minutes", "m"],
        ]);
        expect(getVisibleCountdownUnits({ days: 0, hours: 3 })).toEqual([
            ["hours", "h"], ["minutes", "m"],
        ]);
        expect(getVisibleCountdownUnits({ days: 0, hours: 0 })).toEqual([
            ["minutes", "m"], ["seconds", "s"],
        ]);
    });
});
