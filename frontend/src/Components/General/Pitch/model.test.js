import { describe, expect, it } from "vitest";

import { getLeadingPlayerId } from "./model";

const squad = {
    startingLineup: { GK: [1], DEF: [2], MID: [3], FWD: [4] },
    bench: { GK: 5, S1: 6, S2: 7, S3: 8 },
    captainId: 3,
    tripleCaptainActive: false,
};

describe("getLeadingPlayerId", () => {
    it("returns the player contributing the most fantasy points", () => {
        expect(getLeadingPlayerId(squad, [
            { playerId: 1, points: 2 },
            { playerId: 3, points: 6 },
            { playerId: 6, points: 11 },
        ])).toBe(3);
    });

    it("uses the triple-captain multiplier when the chip is active", () => {
        expect(getLeadingPlayerId({ ...squad, tripleCaptainActive: true }, [
            { playerId: 3, points: 4 },
            { playerId: 6, points: 11 },
        ])).toBe(3);
    });

    it("uses squad order as a deterministic tie-breaker", () => {
        expect(getLeadingPlayerId({ ...squad, captainId: 4 }, [
            { playerId: 2, points: 7 },
            { playerId: 3, points: 7 },
        ])).toBe(2);
    });

    it("does not crown a player before anyone has scored", () => {
        expect(getLeadingPlayerId(squad, [
            { playerId: 1, points: 0 },
            { playerId: 2, points: 0 },
        ])).toBeNull();
    });
});
