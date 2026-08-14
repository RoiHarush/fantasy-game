import { describe, expect, it } from "vitest";

import { getLeagueLeadingPlayerId } from "./model";

describe("getLeagueLeadingPlayerId", () => {
    it("uses the single league-wide winner selected by the backend", () => {
        expect(getLeagueLeadingPlayerId([
            { playerId: 1, points: 20, leagueGameweekLeader: false },
            { playerId: 3, points: 8, leagueGameweekLeader: true },
        ])).toBe(3);
    });

    it("does not infer a local squad winner when this squad does not own the league winner", () => {
        expect(getLeagueLeadingPlayerId([
            { playerId: 1, points: 20, leagueGameweekLeader: false },
            { playerId: 2, points: 14, leagueGameweekLeader: false },
        ])).toBeNull();
    });
});
