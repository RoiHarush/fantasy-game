import { z } from "zod";

const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_LOGO_BYTES = 3 * 1024 * 1024;

export const teamProfileSchema = z.object({
    teamName: z.string().trim().min(2, "Team name must contain at least 2 characters").max(50),
    logo: z.any().nullable().refine(
        (file) => !file || file.size <= MAX_LOGO_BYTES,
        "Team logo may not be larger than 3 MB",
    ).refine(
        (file) => !file || ACCEPTED_IMAGE_TYPES.has(file.type),
        "Choose a PNG, JPEG, WebP, or GIF image",
    ),
});
