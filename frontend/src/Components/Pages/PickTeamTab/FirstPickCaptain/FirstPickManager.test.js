import { describe, expect, it } from "vitest";

import { getFirstPickCaptainUnavailableReason } from "./FirstPickManager";

describe("getFirstPickCaptainUnavailableReason", () => {
    const available = {
        isActive: false,
        isUsedUp: false,
        tripleCaptainActive: false,
        firstPickId: 7,
        firstPickName: "Raya",
        isFirstPickInStarting: true,
    };

    it("allows the chip when the first pick starts and triple captain is inactive", () => {
        expect(getFirstPickCaptainUnavailableReason(available)).toBe("");
    });

    it("explains that a benched first pick must return to the starting XI", () => {
        expect(getFirstPickCaptainUnavailableReason({ ...available, isFirstPickInStarting: false }))
            .toBe("Move Raya into the starting XI to use this chip.");
    });

    it("explains the triple-captain conflict", () => {
        expect(getFirstPickCaptainUnavailableReason({ ...available, tripleCaptainActive: true }))
            .toBe("Unavailable while Triple Captain is active.");
    });

    it("requires an explicit team save before any chip action", () => {
        expect(getFirstPickCaptainUnavailableReason({ ...available, hasUnsavedChanges: true }))
            .toBe("Save your team changes before using this chip.");
    });

    it("blocks chip actions while the explicit save is still pending", () => {
        expect(getFirstPickCaptainUnavailableReason({ ...available, squadSavePending: true }))
            .toBe("Wait for your team changes to finish saving.");
    });
});
