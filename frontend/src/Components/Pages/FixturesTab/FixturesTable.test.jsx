import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
    default: ({ alt }) => <span role="img" aria-label={alt || "decorative image"} />,
}));

vi.mock("../../../features/fixtures/useFixtures", () => ({
    useFixtures: () => ({ data: [], isPending: false, error: null }),
}));

vi.mock("../../../features/teams/useTeams", () => ({
    useTeams: () => ({ teams: [], isPending: false, error: null }),
}));

vi.mock("./TeamLogo", () => ({
    default: ({ team }) => <span role="img" aria-label={`${team?.name || "Unknown team"} badge`} />,
}));

import FixturesTable from "./FixturesTable";

const gameweeks = [{ id: 1 }, { id: 2 }];
const previewData = {
    teams: [
        { id: 1, name: "Arsenal" },
        { id: 2, name: "Chelsea" },
    ],
    fixtures: [
        {
            id: 11,
            event: 1,
            homeTeamId: 1,
            awayTeamId: 2,
            kickoff_time: "2026-08-21T18:00:00Z",
            homeScore: null,
            awayScore: null,
        },
        {
            id: 12,
            event: 2,
            homeTeamId: 2,
            awayTeamId: 1,
            kickoff_time: "2026-08-28T18:00:00Z",
            homeScore: 2,
            awayScore: 1,
        },
    ],
};

describe("FixturesTable", () => {
    afterEach(() => cleanup());

    it("preserves first and last gameweek navigation boundaries", () => {
        render(
            <FixturesTable
                gameweeks={gameweeks}
                defaultGameweek={gameweeks[0]}
                previewData={previewData}
            />,
        );

        expect(screen.getByRole("heading", { name: "Fixtures – Gameweek 1" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Previous/ })).not.toBeInTheDocument();
        expect(screen.getByText("Arsenal")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Next/ }));

        expect(screen.getByRole("heading", { name: "Fixtures – Gameweek 2" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Previous/ })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Next/ })).not.toBeInTheDocument();
        expect(screen.getByText("2 - 1")).toBeInTheDocument();
    });
});
