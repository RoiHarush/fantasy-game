import { describe, expect, it } from "vitest";

import { formatAppDateTime, formatAppLongDate, formatAppTime, getAppDateKey } from "./dateTime";

describe("application date formatting", () => {
    it("keeps backend local-date-time arrays stable across browser time zones", () => {
        expect(formatAppDateTime([2026, 8, 21, 20, 45])).toBe("Fri 21 Aug 20:45");
    });

    it("formats date-only arrays without shifting their calendar day", () => {
        expect(formatAppLongDate([2026, 8, 21])).toBe("Friday 21 August");
    });

    it("returns null for unusable date-time values", () => {
        expect(formatAppDateTime(null)).toBeNull();
        expect(formatAppDateTime("not-a-date")).toBeNull();
    });

    it("groups and displays ISO timestamps in the league time zone", () => {
        const kickoff = "2026-08-21T18:45:00Z";
        expect(getAppDateKey(kickoff)).toBe("2026-08-21");
        expect(formatAppTime(kickoff)).toBe("21:45");
    });
});
