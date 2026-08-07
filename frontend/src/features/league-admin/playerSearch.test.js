import { describe, expect, it } from "vitest";

import { findPlayers, normalizePlayerSearch } from "./playerSearch";

const players = [
    { id: 1, viewName: "Ødegaard", firstName: "Martin", lastName: "Ødegaard", available: true },
    { id: 2, viewName: "Salah", firstName: "Mohamed", lastName: "Salah", available: false },
];

describe("league-admin player search", () => {
    it("normalizes accented football names", () => {
        expect(normalizePlayerSearch("Ødegaard")).toBe("odegaard");
        expect(findPlayers(players, "ode")).toEqual([players[0]]);
    });

    it("can restrict administrative searches to free agents", () => {
        expect(findPlayers(players, "salah", { availableOnly: true })).toEqual([]);
        expect(findPlayers(players, "salah")).toEqual([players[1]]);
    });
});
