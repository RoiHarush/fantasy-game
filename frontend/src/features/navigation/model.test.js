import { describe, expect, it } from "vitest";

import { getSiteNavigation, isNavigationItemActive } from "./model";

describe("site navigation", () => {
    it("only exposes onboarding-safe routes before a user joins a league", () => {
        expect(getSiteNavigation({ id: 1 }).map(({ href }) => href)).toEqual([
            "/scout",
            "/onboarding",
        ]);
    });

    it("includes league control only for league administrators", () => {
        const memberRoutes = getSiteNavigation({ leagueId: 1, leagueStatus: "ACTIVE" });
        const adminRoutes = getSiteNavigation({ leagueId: 1, leagueStatus: "ACTIVE", leagueAdmin: true });

        expect(memberRoutes.some(({ href }) => href === "/league-control")).toBe(false);
        expect(adminRoutes.some(({ href }) => href === "/league-control")).toBe(true);
    });

    it("matches nested pages to their parent navigation item", () => {
        expect(isNavigationItemActive("/points/42", "/points")).toBe(true);
        expect(isNavigationItemActive("/pick-team", "/points")).toBe(false);
    });
});
