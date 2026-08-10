import { describe, expect, it } from "vitest";

import { teamProfileSchema } from "./schema";

describe("teamProfileSchema", () => {
    it("accepts a team name without replacing the logo", () => {
        expect(teamProfileSchema.safeParse({ teamName: "Query United", logo: null }).success).toBe(true);
    });

    it("rejects unsupported image types", () => {
        const logo = new File(["not-an-image"], "badge.svg", { type: "image/svg+xml" });
        const result = teamProfileSchema.safeParse({ teamName: "Query United", logo });
        expect(result.success).toBe(false);
    });
});
