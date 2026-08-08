import { z } from "zod";

export const adminUserDetailsSchema = z.object({
    userId: z.number().int().positive(),
    username: z.string().trim().min(3).max(30),
    name: z.string().trim().min(2).max(50),
    role: z.enum(["ROLE_USER", "ROLE_SUPER_ADMIN"]),
    fantasyTeamName: z.string().trim().max(50).refine(
        (value) => value.length === 0 || value.length >= 2,
        "Fantasy team name must be empty or contain at least 2 characters",
    ),
    password: z.union([z.literal(""), z.string().min(8).max(72)]),
    chips: z.record(z.string(), z.coerce.number().int().min(0)),
    activeChips: z.record(z.string(), z.boolean()),
    gameweekPoints: z.array(z.object({
        gameweek: z.number().int().positive(),
        points: z.coerce.number().int(),
        pointsEntityId: z.number().int().nonnegative(),
    })),
});

const squadPositionMapSchema = z.object({
    GK: z.array(z.coerce.number().int().positive()),
    DEF: z.array(z.coerce.number().int().positive()),
    MID: z.array(z.coerce.number().int().positive()),
    FWD: z.array(z.coerce.number().int().positive()),
});

export const manualSquadOverrideSchema = z.object({
    startingLineup: squadPositionMapSchema,
    bench: z.record(z.string(), z.coerce.number().int().nonnegative()),
    formation: z.object({
        GK: z.coerce.number().int().nonnegative(),
        DEF: z.coerce.number().int().nonnegative(),
        MID: z.coerce.number().int().nonnegative(),
        FWD: z.coerce.number().int().nonnegative(),
    }),
    captainId: z.coerce.number().int().nonnegative(),
    viceCaptainId: z.coerce.number().int().nonnegative(),
    irId: z.coerce.number().int().nonnegative().nullable(),
    firstPickId: z.coerce.number().int().nonnegative(),
});
