import { describe, expect, it } from "vitest";

import { getLeagueMemberPointsHref, isSameEntityId } from "./model";

describe("league view model", () => {
    it("treats numeric API ids and route-string ids as the same entity", () => {
        expect(isSameEntityId(7, "7")).toBe(true);
    });

    it("uses the canonical points route for the signed-in manager", () => {
        expect(getLeagueMemberPointsHref(7, "7")).toBe("/points");
        expect(getLeagueMemberPointsHref(8, 7)).toBe("/points/8");
    });
});
