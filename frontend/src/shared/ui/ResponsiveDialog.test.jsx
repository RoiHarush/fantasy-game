import { describe, expect, it } from "vitest";

import { shouldDismissSheetDrag } from "./ResponsiveDialog";

describe("responsive dialog sheet gesture", () => {
    it("returns to its resting position after a short, slow pull", () => {
        expect(shouldDismissSheetDrag(48, 400)).toBe(false);
    });

    it("dismisses after a meaningful downward pull", () => {
        expect(shouldDismissSheetDrag(120, 600)).toBe(true);
    });

    it("dismisses a short but intentional flick", () => {
        expect(shouldDismissSheetDrag(72, 100)).toBe(true);
    });
});
