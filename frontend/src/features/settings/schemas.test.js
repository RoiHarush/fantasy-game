import { describe, expect, it } from "vitest";

import { settingsSchema } from "./schemas";
import { buildSettingsPayload } from "./model";

const validSettings = {
    teamName: "Query United",
    name: "Test Manager",
    username: "test.manager",
    currentPassword: "",
    newPassword: "",
};

describe("settingsSchema", () => {
    it("accepts profile changes without a password change", () => {
        expect(settingsSchema.safeParse(validSettings).success).toBe(true);
    });

    it("requires the current password when setting a new password", () => {
        const result = settingsSchema.safeParse({
            ...validSettings,
            newPassword: "new-password",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toEqual(["currentPassword"]);
    });
});

describe("buildSettingsPayload", () => {
    const user = {
        name: "Old Name",
        username: "old.username",
        fantasyTeamName: "Old Team",
    };

    it("sends only changed profile fields", () => {
        expect(buildSettingsPayload({
            name: "New Name",
            username: user.username,
            teamName: user.fantasyTeamName,
            currentPassword: "",
            newPassword: "",
        }, user)).toEqual({ name: "New Name" });
    });

    it("includes both passwords only for a password change", () => {
        expect(buildSettingsPayload({
            name: user.name,
            username: user.username,
            teamName: user.fantasyTeamName,
            currentPassword: "old-password",
            newPassword: "new-password",
        }, user)).toEqual({
            currentPassword: "old-password",
            newPassword: "new-password",
        });
    });
});
