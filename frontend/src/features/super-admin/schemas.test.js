import { describe, expect, it } from "vitest";

import { adminUserDetailsSchema, manualSquadOverrideSchema } from "./schemas";

const validSquad = {
    startingLineup: { GK: [1], DEF: [2, 3, 4], MID: [5, 6, 7, 8], FWD: [9, 10, 11] },
    bench: { GK: 12, S1: 13, S2: 14, S3: 15 },
    formation: { GK: 1, DEF: 3, MID: 4, FWD: 3 },
    captainId: 5,
    viceCaptainId: 6,
    irId: null,
    firstPickId: 1,
};

describe("manualSquadOverrideSchema", () => {
    it("accepts a complete squad payload", () => {
        expect(manualSquadOverrideSchema.safeParse(validSquad).success).toBe(true);
    });

    it("rejects malformed player ids before a destructive admin request", () => {
        expect(manualSquadOverrideSchema.safeParse({
            ...validSquad,
            startingLineup: { ...validSquad.startingLineup, GK: ["not-an-id"] },
        }).success).toBe(false);
    });
});

describe("adminUserDetailsSchema", () => {
    it("allows a user who has not created a fantasy team yet", () => {
        const result = adminUserDetailsSchema.safeParse({
            userId: 1,
            username: "manager",
            name: "Manager",
            role: "ROLE_USER",
            fantasyTeamName: "",
            password: "",
            chips: {},
            activeChips: {},
            gameweekPoints: [],
        });

        expect(result.success).toBe(true);
    });
});
