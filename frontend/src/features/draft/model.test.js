import { describe, expect, it } from "vitest";

import { toDateTimeLocalInput, validateDraftOrder } from "./model";

describe("draft model", () => {
    it("normalizes Java date arrays for datetime-local inputs", () => {
        expect(toDateTimeLocalInput([2026, 8, 21, 20, 5])).toBe("2026-08-21T20:05");
    });

    it("trims ISO timestamps without changing their wall-clock value", () => {
        expect(toDateTimeLocalInput("2026-08-21T20:05:00")).toBe("2026-08-21T20:05");
    });

    it("accepts every initial-draft manager exactly once", () => {
        expect(validateDraftOrder([3, 1, 2], [1, 2, 3])).toBeNull();
    });

    it("rejects duplicate or incomplete initial-draft orders", () => {
        expect(validateDraftOrder([1, 1, 2], [1, 2, 3]))
            .toBe("Each manager must appear exactly once.");
        expect(validateDraftOrder([1, 2], [1, 2, 3]))
            .toBe("Choose a manager for all 3 draft positions.");
    });

    it("supports the existing two-round supplemental order", () => {
        expect(validateDraftOrder([1, 2, 2, 1], [1, 2], 2)).toBeNull();
    });
});
