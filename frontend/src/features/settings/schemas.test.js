import { describe, expect, it } from "vitest";

import { settingsSchema } from "./schemas";
import { buildSettingsPayload } from "./model";

const validSettings = {
    firstName: "Test",
    lastName: "Manager",
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
        firstName: "Old",
        lastName: "Name",
        username: "old.username",
    };

    it("sends only changed profile fields", () => {
        expect(buildSettingsPayload({
            firstName: "New",
            lastName: "Manager",
            username: user.username,
            currentPassword: "",
            newPassword: "",
        }, user)).toEqual({ firstName: "New", lastName: "Manager" });
    });

    it("includes both passwords only for a password change", () => {
        expect(buildSettingsPayload({
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            currentPassword: "old-password",
            newPassword: "new-password",
        }, user)).toEqual({
            currentPassword: "old-password",
            newPassword: "new-password",
        });
    });
});
