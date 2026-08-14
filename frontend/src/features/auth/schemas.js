import { z } from "zod";

const username = z.string()
    .trim()
    .min(3, "Username must contain at least 3 characters")
    .max(30, "Username may contain at most 30 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Use only letters, digits, dots, underscores, or hyphens");

export const loginSchema = z.object({
    identifier: z.string().trim().min(3, "Enter your email or username").max(320),
    password: z.string().min(1, "Password is required").max(72),
});

export const registrationSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required").max(50),
    lastName: z.string().trim().min(1, "Last name is required").max(50),
    username,
    email: z.string().trim().email("Enter a valid email address").max(320),
    password: z.string().min(8, "Password must contain at least 8 characters").max(72),
    confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});

export const emailSchema = z.object({
    email: z.string().trim().email("Enter a valid email address").max(320),
});

export const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password must contain at least 8 characters").max(72),
    confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});
