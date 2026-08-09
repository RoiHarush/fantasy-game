import { describe, expect, it } from "vitest";

import { getInitials } from "./initials";

describe("getInitials", () => {
    it("uses the first and last name for a full name", () => {
        expect(getInitials("Roi Harush")).toBe("RH");
    });

    it("supports middle names and single names", () => {
        expect(getInitials("Mohamed Ali Salah")).toBe("MS");
        expect(getInitials("Pelé")).toBe("PE");
    });

    it("returns the requested fallback for a missing name", () => {
        expect(getInitials(null, "FA")).toBe("FA");
    });
});
