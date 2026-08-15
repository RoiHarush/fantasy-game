import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import CompletedTransferWindowView from "./CompletedTransferWindowView";

afterEach(cleanup);

describe("CompletedTransferWindowView", () => {
    it("explains that the current gameweek window has already finished", () => {
        render(<CompletedTransferWindowView gameweekId={4} />);

        expect(screen.getByRole("heading", { name: "Transfers are complete" })).toBeInTheDocument();
        expect(screen.getByText("· GW 4")).toBeInTheDocument();
        expect(screen.getByText("Waiting for the gameweek to begin")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Open now/i })).not.toBeInTheDocument();
    });
});
