import { z } from "zod";

const scoreSchema = z.coerce.number().min(-100).max(100);

const scoringRuleRowsSchema = z.array(z.object({
    rule: z.string().min(1),
    points: scoreSchema,
})).superRefine((rows, context) => {
    const knownRules = new Set();

    rows.forEach(({ rule }, index) => {
        if (knownRules.has(rule)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate scoring rule: ${rule}`,
                path: [index, "rule"],
            });
        }
        knownRules.add(rule);
    });
});

export const scoringRulesInputSchema = z.union([
    z.record(z.string(), scoreSchema),
    scoringRuleRowsSchema,
]).transform((rules) => (
    Array.isArray(rules)
        ? Object.fromEntries(rules.map(({ rule, points }) => [rule, points]))
        : rules
));

export function toScoringRuleRows(scoringRules = {}) {
    return Object.entries(scoringRules).map(([rule, points]) => ({ rule, points }));
}

export function formatScoringRule(rule) {
    return rule.replaceAll("_", " ").replaceAll(".", " · ");
}
