import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AutoSubstitutionList from "./AutoSubstitutionList";

vi.mock("../../../Context/TeamsContext", () => ({
    useTeam: () => ({ name: "Test club", fieldKitUrl: "/kit.webp", goalkeeperKitUrl: "/gk.webp" }),
}));

describe("AutoSubstitutionList", () => {
    it("renders persisted incoming and outgoing players in substitution order", () => {
        const players = [
            { id: 10, viewName: "Starter", teamId: 1, position: "MID" },
            { id: 20, viewName: "Bench hero", teamId: 2, position: "MID" },
        ];

        render(
            <AutoSubstitutionList
                substitutions={[{ playerInId: 20, playerOutId: 10, sequence: 1 }]}
                players={players}
            />,
        );

        expect(screen.getByRole("heading", { name: "Automatic substitutions" })).toBeInTheDocument();
        expect(screen.getByText("Bench hero")).toBeInTheDocument();
        expect(screen.getByText("Starter")).toBeInTheDocument();
        expect(screen.getByText("In")).toBeInTheDocument();
        expect(screen.getByText("Out")).toBeInTheDocument();
    });

    it("renders nothing when no automatic substitutions were applied", () => {
        const { container } = render(<AutoSubstitutionList substitutions={[]} players={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
});
