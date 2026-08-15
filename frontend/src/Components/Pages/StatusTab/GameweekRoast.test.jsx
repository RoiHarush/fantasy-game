import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import GameweekRoast from "./GameweekRoast";

describe("GameweekRoast", () => {
    it("clearly presents the postponed feature without an inactive action", () => {
        render(<GameweekRoast gameweekId={4} />);

        expect(screen.getByText("AI Roast — Coming soon")).toBeInTheDocument();
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
