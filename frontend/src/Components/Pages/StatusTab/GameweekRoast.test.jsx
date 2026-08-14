import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const roastMocks = vi.hoisted(() => ({
    query: { data: null, isPending: false },
    mutation: { data: null, isPending: false, isError: false, error: null, mutate: vi.fn() },
}));

vi.mock("../../../features/status/useStatusData", () => ({
    useGameweekRoast: () => roastMocks.query,
    useGenerateGameweekRoast: () => roastMocks.mutation,
}));

import GameweekRoast from "./GameweekRoast";

describe("GameweekRoast", () => {
    beforeEach(() => {
        roastMocks.query = { data: null, isPending: false };
        roastMocks.mutation = { data: null, isPending: false, isError: false, error: null, mutate: vi.fn() };
    });

    afterEach(() => cleanup());

    it("generates only after the user explicitly asks for a roast", () => {
        render(<GameweekRoast gameweekId={4} />);

        fireEvent.click(screen.getByRole("button", { name: "Roast my gameweek" }));
        expect(roastMocks.mutation.mutate).toHaveBeenCalledOnce();
    });

    it("renders the stable cached roast instead of another action", () => {
        roastMocks.query = {
            data: { gameweek: 4, content: "The bench had more ambition than the starting eleven." },
            isPending: false,
        };

        render(<GameweekRoast gameweekId={4} />);

        expect(screen.getByText(/bench had more ambition/i)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Roast my gameweek" })).not.toBeInTheDocument();
    });
});

