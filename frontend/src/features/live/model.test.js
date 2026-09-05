import { describe, expect, it } from "vitest";

import { filterLiveFixtures, getLiveManagers } from "./model";

const fixtures = [{
    id: 10,
    players: [
        { playerId: 1, ownerUserId: 4, ownerName: "Roi", ownerTeamName: "Lions", participation: "STARTED" },
        { playerId: 2, ownerUserId: 7, ownerName: "Dan", ownerTeamName: "Eagles", participation: "NOT_PLAYED" },
    ],
}];

describe("league live model", () => {
    it("deduplicates and sorts managers by fantasy team", () => {
        expect(getLiveManagers([...fixtures, ...fixtures]).map(({ teamName }) => teamName)).toEqual(["Eagles", "Lions"]);
    });

    it("filters players without removing the live fixture scoreboard", () => {
        expect(filterLiveFixtures(fixtures, 4, "played")).toEqual([{
            ...fixtures[0],
            players: [fixtures[0].players[0]],
        }]);
    });
});
