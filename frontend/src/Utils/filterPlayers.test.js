import { describe, expect, it } from "vitest";

import { filterPlayers } from "./filterPlayers";

const players = [
    { id: 1, viewName: "Raya", position: "GK", teamId: 1, points: 50, available: true },
    { id: 2, viewName: "Gabriel", position: "DEF", teamId: 1, points: 80, available: true },
    { id: 3, viewName: "Van Dijk", position: "DEF", teamId: 14, points: 90, available: true },
];

describe("filterPlayers", () => {
    it("combines position and club filters", () => {
        expect(filterPlayers({ players, positionFilter: "DEF", teamFilter: "1" }))
            .toEqual([players[1]]);
    });

    it("keeps the forced IR position while applying the club filter", () => {
        expect(filterPlayers({ players, irPosition: "defender", teamFilter: "14" }))
            .toEqual([players[2]]);
    });
});
