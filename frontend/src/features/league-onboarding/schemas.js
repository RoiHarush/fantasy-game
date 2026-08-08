import { z } from "zod";

import { scoringRulesInputSchema } from "../league/scoringRules";

const teamName = z.string().trim().min(2, "Team name must contain at least 2 characters").max(50);

export const createLeagueSchema = z.object({
    leagueName: z.string().trim().min(2, "League name must contain at least 2 characters").max(80),
    teamName,
    maxParticipants: z.coerce.number().int().min(2).max(20),
    scoringRules: scoringRulesInputSchema,
});

export const joinLeagueSchema = z.object({
    leagueCode: z.string().trim().min(6, "League code must contain at least 6 characters").max(12),
    teamName,
});
