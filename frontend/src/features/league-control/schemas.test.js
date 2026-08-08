import { describe, expect, it } from "vitest";

import { leagueSettingsSchema } from "./schemas";

describe("leagueSettingsSchema", () => {
    it("coerces numeric form values and accepts negative scoring rules", () => {
        const result = leagueSettingsSchema.safeParse({
            name: "Seven Managers",
            maxParticipants: "7",
            scoringRules: { PENALTY_MISS: "-2" },
        });

        expect(result.success).toBe(true);
        expect(result.data).toMatchObject({
            maxParticipants: 7,
            scoringRules: { PENALTY_MISS: -2 },
        });
    });

    it("preserves dotted scoring-rule keys submitted as form rows", () => {
        const result = leagueSettingsSchema.parse({
            name: "Seven Managers",
            maxParticipants: 7,
            scoringRules: [
                { rule: "GOAL.FORWARD", points: "4" },
                { rule: "GOAL.MIDFIELDER", points: "5" },
            ],
        });

        expect(result.scoringRules).toEqual({
            "GOAL.FORWARD": 4,
            "GOAL.MIDFIELDER": 5,
        });
    });
});
