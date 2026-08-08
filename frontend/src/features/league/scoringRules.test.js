import { describe, expect, it } from "vitest";

import { formatScoringRule, scoringRulesInputSchema, toScoringRuleRows } from "./scoringRules";

describe("league scoring rules", () => {
    it("round-trips flat keys through editable rows", () => {
        const rules = {
            "GOAL.FORWARD": 6,
            "PENALTY_CONCEDED.ALL": -4,
        };

        expect(scoringRulesInputSchema.parse(toScoringRuleRows(rules))).toEqual(rules);
    });

    it("rejects duplicate rule rows", () => {
        expect(scoringRulesInputSchema.safeParse([
            { rule: "ASSIST.ALL", points: 3 },
            { rule: "ASSIST.ALL", points: 4 },
        ]).success).toBe(false);
    });

    it("formats technical keys for display without changing the stored key", () => {
        expect(formatScoringRule("PENALTY_CONCEDED.ALL")).toBe("PENALTY CONCEDED · ALL");
    });
});
