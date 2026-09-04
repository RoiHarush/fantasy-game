import { describe, expect, it } from "vitest";

import {
    getMobilePrimaryNavigation,
    getMobileQuickMenuNavigation,
    getMobileSecondaryNavigation,
    getSiteNavigation,
    isNavigationItemActive,
} from "./model";

describe("site navigation", () => {
    it("only exposes onboarding-safe routes before a user joins a league", () => {
        const navigation = getSiteNavigation({ id: 1 });

        expect(navigation.map(({ href }) => href)).toEqual([
            "/scout",
            "/onboarding",
        ]);
        expect(getMobilePrimaryNavigation(navigation).map(({ href }) => href)).toEqual(["/scout"]);
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

    it("keeps league in the mobile dock and player-market screens in their own menu", () => {
        const navigation = getSiteNavigation({ leagueId: 1, leagueStatus: "ACTIVE" });

        expect(getMobilePrimaryNavigation(navigation).map(({ href }) => href)).toEqual([
            "/status",
            "/points",
            "/pick-team",
            "/league",
        ]);
        expect(getMobileQuickMenuNavigation(navigation).map(({ href }) => href)).toEqual([
            "/scout",
            "/transfer-window",
            "/draft-room",
            "/trades",
        ]);
        expect(getMobileSecondaryNavigation(navigation).map(({ href }) => href)).toEqual([
            "/fixtures",
            "/settings",
        ]);
    });
});
