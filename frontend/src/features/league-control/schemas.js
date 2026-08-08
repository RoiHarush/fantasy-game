import { z } from "zod";
import { scoringRulesInputSchema } from "../league/scoringRules";

export const leagueSettingsSchema = z.object({
    name: z.string().trim().min(2, "League name must contain at least 2 characters").max(80),
    maxParticipants: z.coerce.number().int().min(2).max(20),
    scoringRules: scoringRulesInputSchema,
});
