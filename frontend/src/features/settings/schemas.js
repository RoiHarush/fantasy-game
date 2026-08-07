import { z } from "zod";

const optionalPassword = z.union([
    z.literal(""),
    z.string().min(8, "Password must contain at least 8 characters").max(72),
]);

export const settingsSchema = z.object({
    teamName: z.string().trim().min(2, "Team name must contain at least 2 characters").max(50),
    name: z.string().trim().min(2, "Display name must contain at least 2 characters").max(50),
    username: z.string()
        .trim()
        .min(3, "Username must contain at least 3 characters")
        .max(30, "Username may contain at most 30 characters")
        .regex(/^[a-zA-Z0-9._-]+$/, "Use only letters, digits, dots, underscores, or hyphens"),
    currentPassword: z.string().max(72),
    newPassword: optionalPassword,
}).superRefine((values, context) => {
    if (values.newPassword && !values.currentPassword) {
        context.addIssue({
            code: "custom",
            path: ["currentPassword"],
            message: "Current password is required when changing your password",
        });
    }
});
