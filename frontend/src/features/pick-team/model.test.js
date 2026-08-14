import { describe, expect, it } from "vitest";

import {
    buildSaveTeamDto,
    countSquadPlayers,
    getGameweekChipUnavailableReason,
    getIrChipUnavailableReason,
    getUnsavedSquadActionReason,
    isFirstPickStarting,
} from "./model";

const squad = {
    startingLineup: { GK: [1], DEF: [2, 3, 4], MID: [5, 6, 7, 8], FWD: [9, 10, 11] },
    bench: { GK: 12, first: 13, second: 14, third: 15 },
    captainId: 5,
    viceCaptainId: 9,
    irId: null,
    firstPickId: 2,
};

describe("pick-team model", () => {
    it("builds the authoritative save payload from the edited squad", () => {
        expect(buildSaveTeamDto(squad)).toMatchObject({
            formation: { GK: 1, DEF: 3, MID: 4, FWD: 3 },
            captainId: 5,
            viceCaptainId: 9,
            firstPickId: 2,
        });
    });

    it("counts a complete squad and detects the first pick in the lineup", () => {
        expect(countSquadPlayers(squad)).toBe(15);
        expect(isFirstPickStarting(squad)).toBe(true);
        expect(isFirstPickStarting({ ...squad, firstPickId: 13 })).toBe(false);
    });

    it("does not count a duplicated player as an additional squad member", () => {
        const duplicated = {
            ...squad,
            bench: { ...squad.bench, third: 14 },
        };
        expect(countSquadPlayers(duplicated)).toBe(14);
    });
});

describe("chip availability reasons", () => {
    it("explains when a Gameweek chip has no uses left", () => {
        expect(getGameweekChipUnavailableReason({
            title: "Bench Boost",
            isActive: false,
            remaining: 0,
        })).toBe("No Bench Boost uses remain.");
    });

    it("prefers the explicit cross-chip conflict reason", () => {
        expect(getGameweekChipUnavailableReason({
            title: "Triple Captain",
            isActive: false,
            remaining: 1,
            disabledReason: "Unavailable while First Pick Captain is active.",
        })).toBe("Unavailable while First Pick Captain is active.");
    });

    it("explains every blocked IR state", () => {
        expect(getIrChipUnavailableReason({
            isActive: false,
            remaining: 2,
            playersCount: 15,
            transferWindowProcessed: true,
        })).toBe("IR actions are unavailable after the deadline.");

        expect(getIrChipUnavailableReason({
            isActive: true,
            remaining: 1,
            playersCount: 14,
            transferWindowProcessed: false,
        })).toBe("Your squad must contain 15 players before releasing IR.");

        expect(getIrChipUnavailableReason({
            isActive: false,
            remaining: 0,
            playersCount: 15,
            transferWindowProcessed: false,
        })).toBe("No IR Chip uses remain.");
    });
});

describe("getUnsavedSquadActionReason", () => {
    it("requires an explicit save before persistent actions", () => {
        expect(getUnsavedSquadActionReason(true, false)).toBe(
            "Save your team changes before using this chip.",
        );
    });

    it("reports a save already in progress", () => {
        expect(getUnsavedSquadActionReason(true, true)).toBe(
            "Wait for your team changes to finish saving.",
        );
    });
});
