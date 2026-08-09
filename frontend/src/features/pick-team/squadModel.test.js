import { describe, expect, it } from "vitest";

import {
    applySquadSwap,
    assignCaptain,
    assignViceCaptain,
    getAllowedSwapIds,
} from "./squadModel";

const players = [
    { id: 1, position: "GK" },
    { id: 2, position: "GK" },
    { id: 3, position: "DEF" },
    { id: 4, position: "DEF" },
    { id: 5, position: "DEF" },
    { id: 6, position: "DEF" },
    { id: 7, position: "DEF" },
    { id: 8, position: "MID" },
    { id: 9, position: "MID" },
    { id: 10, position: "MID" },
    { id: 11, position: "FWD" },
    { id: 12, position: "FWD" },
    { id: 13, position: "FWD" },
    { id: 14, position: "MID" },
    { id: 15, position: "FWD" },
];

const createSquad = () => ({
    startingLineup: {
        GK: [1],
        DEF: [3, 4, 5, 6],
        MID: [8, 9, 10],
        FWD: [11, 12, 13],
    },
    bench: { GK: 2, first: 7, second: 14, third: 15 },
    captainId: 6,
    viceCaptainId: 8,
    firstPickId: 3,
});

describe("pick-team squad model", () => {
    it("allows a cross-position swap only while the formation remains legal", () => {
        const squad = createSquad();

        expect(getAllowedSwapIds(squad, 6, players, false)).toContain(14);
        expect(getAllowedSwapIds(squad, 5, players, false)).toContain(14);

        const minimumDefence = { ...squad, startingLineup: { ...squad.startingLineup, DEF: [3, 4, 5] } };
        expect(getAllowedSwapIds(minimumDefence, 5, players, false)).not.toContain(14);
    });

    it("updates the formation immediately without mutating the saved squad", () => {
        const squad = createSquad();
        const updated = applySquadSwap(squad, 6, 14, players);

        expect(updated.startingLineup.DEF).toEqual([3, 4, 5]);
        expect(updated.startingLineup.MID).toEqual([8, 9, 10, 14]);
        expect(updated.bench.second).toBe(6);
        expect(squad.startingLineup.DEF).toEqual([3, 4, 5, 6]);
    });

    it("moves captaincy with a starter who is sent to the bench", () => {
        const updated = applySquadSwap(createSquad(), 6, 14, players);

        expect(updated.captainId).toBe(14);
        expect(updated.viceCaptainId).toBe(8);
    });

    it("keeps captain and vice-captain roles mutually exclusive", () => {
        const squad = createSquad();

        expect(assignCaptain(squad, 8)).toMatchObject({ captainId: 8, viceCaptainId: 6 });
        expect(assignViceCaptain(squad, 6)).toMatchObject({ captainId: 8, viceCaptainId: 6 });
    });

    it("normalizes ids received as strings without changing the stored id type", () => {
        const squad = createSquad();
        const updated = applySquadSwap(squad, "6", "14", players);

        expect(updated.startingLineup.DEF).toEqual([3, 4, 5]);
        expect(updated.startingLineup.MID).toEqual([8, 9, 10, "14"]);
        expect(updated.bench.second).toBe("6");
        expect(updated.captainId).toBe("14");
    });

    it("returns no swap targets when player data is unavailable", () => {
        expect(getAllowedSwapIds(createSquad(), 999, players, false)).toEqual([]);
    });

    it("locks the first-pick captain as both a swap source and target while the chip is active", () => {
        const squad = createSquad();

        expect(getAllowedSwapIds(squad, squad.firstPickId, players, true)).toEqual([]);
        expect(getAllowedSwapIds(squad, 7, players, true)).not.toContain(squad.firstPickId);
        expect(applySquadSwap(squad, squad.firstPickId, 7, players, true)).toBe(squad);
        expect(applySquadSwap(squad, 7, squad.firstPickId, players, true)).toBe(squad);
    });

    it("also protects a first-pick goalkeeper from goalkeeper swaps", () => {
        const squad = {
            ...createSquad(),
            firstPickId: 1,
            captainId: 1,
        };

        expect(getAllowedSwapIds(squad, 1, players, true)).toEqual([]);
        expect(getAllowedSwapIds(squad, 2, players, true)).not.toContain(1);
        expect(applySquadSwap(squad, 1, 2, players, true)).toBe(squad);
    });
});
