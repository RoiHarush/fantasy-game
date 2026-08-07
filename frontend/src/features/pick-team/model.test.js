import { describe, expect, it } from "vitest";

import { buildSaveTeamDto, countSquadPlayers, isFirstPickStarting } from "./model";

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
});
