import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
    default: ({ alt }) => <span role="img" aria-label={alt || "decorative pattern"} />,
}));

import Block from "./Block";
import PickTeamBlock from "./PickTeamBlock";
import PointsBlock from "./PointsBlock";

describe("block presentation components", () => {
    afterEach(() => cleanup());

    it("preserves titles and content in the shared block", () => {
        render(<Block title="Upcoming deadlines">Transfer Window</Block>);
        expect(screen.getByText("Upcoming deadlines")).toBeInTheDocument();
        expect(screen.getByText("Transfer Window")).toBeInTheDocument();
    });

    it("renders points and gameweek information", () => {
        render(
            <>
                <PointsBlock points={72} />
                <PickTeamBlock gameweek={4} kickoffTime="2026-09-12T14:00:00Z" />
            </>,
        );

        expect(screen.getByText("72")).toBeInTheDocument();
        expect(screen.getByText("Gameweek 4")).toBeInTheDocument();
    });
});
