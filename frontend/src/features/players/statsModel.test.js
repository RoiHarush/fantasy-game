import { describe, expect, it } from "vitest";

import { buildPlayerStatRow, buildPlayerStatTotals } from "./statsModel";

describe("player stats model", () => {
    it("does not count an explicitly zero clean-sheet stat", () => {
        const row = buildPlayerStatRow({
            gameweekId: 1,
            stats: [
                { name: "Total", points: 2 },
                { name: "Clean sheets", value: 0 },
            ],
        });

        expect(row.cleanSheets).toBe(0);
    });

    it("adds numeric strings without mutating match data", () => {
        const rows = [
            buildPlayerStatRow({ gameweekId: 1, stats: [{ name: "Minutes played", value: "90" }] }),
            buildPlayerStatRow({ gameweekId: 2, stats: [{ name: "Minutes played", value: "45" }] }),
        ];

        expect(buildPlayerStatTotals(rows).minutes).toBe(135);
    });
});
