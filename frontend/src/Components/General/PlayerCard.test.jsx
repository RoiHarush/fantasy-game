import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlayerInteractionProvider } from "../../Context/PlayerInteractionProvider";
import PlayerCard from "./PlayerCard";

vi.mock("../../Context/TeamsContext", () => ({
    useTeam: () => ({ name: "Test club", fieldKitUrl: "/kit.webp", goalkeeperKitUrl: "/gk.webp" }),
}));

const player = {
    id: 1,
    viewName: "Test Player",
    teamId: 1,
    position: "MID",
    chanceOfPlayingNextRound: 100,
};

function renderCard(props) {
    return render(
        <PlayerInteractionProvider mode="points" players={[player]} user={{ id: 7 }} gameweek={{ id: 8 }}>
            <PlayerCard player={player} view="points" {...props} />
        </PlayerInteractionProvider>,
    );
}

describe("PlayerCard fixture summary", () => {
    it("renders double-gameweek fixtures on separate lines with a comma separator", () => {
        const { container } = renderCard({ nextFixtures: ["CHE (H)", "MCI (A)"] });

        expect(screen.getByText("CHE (H),")).toBeInTheDocument();
        expect(screen.getByText("MCI (A)")).toBeInTheDocument();
        expect(container.querySelector(".min-h-8")).toBeInTheDocument();
    });

    it("keeps the compact fixture box for a single match", () => {
        const { container } = renderCard({ nextFixtures: ["CHE (H)"] });

        expect(screen.getByText("CHE (H)")).toBeInTheDocument();
        expect(container.querySelector(".min-h-\\[18px\\]")).toBeInTheDocument();
    });

    it("keeps the fixture box visually empty and shows a postponement badge", () => {
        renderCard({ fixturePostponed: true, nextFixtures: [] });

        expect(screen.getByLabelText("Fixture postponed")).toBeInTheDocument();
        expect(screen.queryByText("-")).not.toBeInTheDocument();
    });
});
