import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import LeaguePresenceStrip from "./LeaguePresenceStrip";

describe("LeaguePresenceStrip", () => {
    afterEach(() => cleanup());

    it("shows a compact online count and opens the manager list on demand", () => {
        render(
            <LeaguePresenceStrip
                members={[
                    { id: 1, name: "Visible Manager" },
                    { id: 2, name: "Background Manager" },
                    { id: 3, name: "Offline Manager" },
                ]}
                activeUserIds={[1]}
            />,
        );

        expect(screen.getByText("1/3 online")).toBeInTheDocument();
        expect(screen.queryByText("Visible Manager")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Open league presence details" }));

        expect(screen.getByText("Visible Manager")).toBeInTheDocument();
        expect(screen.getByText("Background Manager")).toBeInTheDocument();
        expect(screen.getByText("Offline Manager")).toBeInTheDocument();
        expect(screen.getByText("Online")).toBeInTheDocument();
        expect(screen.getAllByText("Offline")).toHaveLength(2);
        expect(screen.queryByText("Background")).not.toBeInTheDocument();
    });

    it("does not mislabel everybody as offline when presence cannot be loaded", () => {
        render(
            <LeaguePresenceStrip
                members={[{ id: 1, name: "Manager" }]}
                unavailable
            />,
        );

        expect(screen.getByText("Unavailable")).toBeInTheDocument();
        expect(screen.queryByText("Offline")).not.toBeInTheDocument();
    });
});
