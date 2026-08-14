import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PreSeasonPointsState } from "./PointsPage";

describe("PreSeasonPointsState", () => {
    afterEach(cleanup);

    it("renders a compact pre-season message without an action button", () => {
        render(<PreSeasonPointsState />);

        expect(screen.getByRole("heading", { name: "Points begin with the first kickoff" })).toBeInTheDocument();
        expect(screen.getByText("Waiting for Gameweek 1")).toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
