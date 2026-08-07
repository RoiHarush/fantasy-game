import { z } from "zod";

const username = z.string()
    .trim()
    .min(3, "Username must contain at least 3 characters")
    .max(30, "Username may contain at most 30 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Use only letters, digits, dots, underscores, or hyphens");

export const loginSchema = z.object({
    username,
    password: z.string().min(1, "Password is required").max(72),
});

export const registrationSchema = z.object({
    name: z.string().trim().min(2, "Display name must contain at least 2 characters").max(50),
    username,
    password: z.string().min(8, "Password must contain at least 8 characters").max(72),
    confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});
