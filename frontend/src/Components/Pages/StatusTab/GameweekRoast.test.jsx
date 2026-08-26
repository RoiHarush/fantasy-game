import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GameweekRoast from "./GameweekRoast";

vi.mock("../../../features/status/useStatusData", () => ({
    useGameweekRoast: () => ({ data: null, error: null }),
    useGenerateGameweekRoast: () => ({ mutate: vi.fn(), isPending: false, error: null }),
}));

describe("GameweekRoast", () => {
    it("explains that the league roast unlocks after the gameweek", () => {
        render(<GameweekRoast gameweekId={4} featureEnabled />);

        expect(screen.getByText(/ייפתח/)).toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("never offers generation in read-only observer mode", () => {
        render(<GameweekRoast gameweekId={4} available featureEnabled readOnly previewFeed={null} />);

        expect(screen.getByText(/בהכנה/)).toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("only offers a manual retry after the gameweek is finalized", () => {
        render(<GameweekRoast gameweekId={4} available manualGenerationAllowed featureEnabled />);

        expect(screen.getByRole("button", { name: /פתח את סבב/ })).toBeInTheDocument();
    });
});
