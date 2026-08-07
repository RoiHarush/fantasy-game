import { z } from "zod";

export const adminUserDetailsSchema = z.object({
    userId: z.number().int().positive(),
    username: z.string().trim().min(3).max(30),
    name: z.string().trim().min(2).max(50),
    role: z.enum(["ROLE_USER", "ROLE_SUPER_ADMIN"]),
    fantasyTeamName: z.string().trim().min(2).max(50),
    password: z.union([z.literal(""), z.string().min(8).max(72)]),
    chips: z.record(z.string(), z.coerce.number().int().min(0)),
    activeChips: z.record(z.string(), z.boolean()),
    gameweekPoints: z.array(z.object({
        gameweek: z.number().int().positive(),
        points: z.coerce.number().int(),
        pointsEntityId: z.number().int().nonnegative(),
    })),
});
