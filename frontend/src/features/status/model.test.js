import { describe, expect, it } from "vitest";

import { deriveStatusGameweekView, getRankLabel, groupTransferActions } from "./model";

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

    it("groups transfer actions by user without changing their order", () => {
        const grouped = groupTransferActions([
            { id: 1, userId: 7, userName: "Roi" },
            { id: 2, userId: 8, userName: "Dan" },
            { id: 3, userId: 7, userName: "Roi" },
        ]);
        expect(grouped.get(7).actions.map(({ id }) => id)).toEqual([1, 3]);
    });
});
