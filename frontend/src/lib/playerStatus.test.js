import { describe, expect, it } from "vitest";

import { getPlayerInjuryColor } from "./playerStatus";

describe("getPlayerInjuryColor", () => {
    it("keeps healthy and unknown players neutral", () => {
        expect(getPlayerInjuryColor(null)).toBeNull();
        expect(getPlayerInjuryColor(100)).toBeNull();
    });

    it("maps availability levels to the existing injury palette", () => {
        expect(getPlayerInjuryColor(0)).toBe("#d81919");
        expect(getPlayerInjuryColor(25)).toBe("#ff3b1f");
        expect(getPlayerInjuryColor(50)).toBe("#ff6b4a");
        expect(getPlayerInjuryColor(75)).toBe("#ff8c80");
    });
});
