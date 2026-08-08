import { describe, expect, it } from "vitest";

import { toDateTimeLocalInput } from "./model";

describe("draft model", () => {
    it("normalizes Java date arrays for datetime-local inputs", () => {
        expect(toDateTimeLocalInput([2026, 8, 21, 20, 5])).toBe("2026-08-21T20:05");
    });

    it("trims ISO timestamps without changing their wall-clock value", () => {
        expect(toDateTimeLocalInput("2026-08-21T20:05:00")).toBe("2026-08-21T20:05");
    });
});
