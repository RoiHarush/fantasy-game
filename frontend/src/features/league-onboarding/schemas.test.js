import { describe, expect, it } from "vitest";

import { createLeagueSchema, joinLeagueSchema } from "./schemas";

const scoringRules = { GOAL: 5, ASSIST: 3 };

describe("league onboarding schemas", () => {
    it("accepts a valid small private league", () => {
        expect(createLeagueSchema.safeParse({
            leagueName: "Friends League",
            teamName: "Query United",
            maxParticipants: 7,
            scoringRules,
        }).success).toBe(true);
    });

    it("rejects participant limits outside the supported range", () => {
        expect(createLeagueSchema.safeParse({
            leagueName: "Friends League",
            teamName: "Query United",
            maxParticipants: 1,
            scoringRules,
        }).success).toBe(false);
    });

    it("preserves dotted scoring-rule keys from form rows", () => {
        const result = createLeagueSchema.parse({
            leagueName: "Friends League",
            teamName: "Query United",
            maxParticipants: 7,
            scoringRules: [
                { rule: "GOAL.FORWARD", points: "6" },
                { rule: "ASSIST.ALL", points: "3" },
            ],
        });

        expect(result.scoringRules).toEqual({
            "GOAL.FORWARD": 6,
            "ASSIST.ALL": 3,
        });
    });

    it("requires a usable league code and fantasy team name", () => {
        expect(joinLeagueSchema.safeParse({
            leagueCode: "ABC123",
            teamName: "My Team",
        }).success).toBe(true);
        expect(joinLeagueSchema.safeParse({
            leagueCode: "ABC",
            teamName: "M",
        }).success).toBe(false);
    });
});
