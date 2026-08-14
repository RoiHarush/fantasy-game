import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../General/PlayerKit", () => ({
    default: ({ teamId }) => <span data-testid={`kit-${teamId}`} />,
}));

import TransferActivityTable from "./TransferActivityTable";

afterEach(cleanup);

const PLAYERS = [
    { id: 10, viewName: "Cole Palmer", position: "MID", teamId: 4 },
    { id: 20, viewName: "Bukayo Saka", position: "MID", teamId: 1 },
];

describe("TransferActivityTable", () => {
    it("renders the durable transfer history with manager, incoming and outgoing players", () => {
        render(
            <TransferActivityTable
                players={PLAYERS}
                actions={[{
                    id: 91,
                    windowType: "TRANSFER",
                    source: "WAIVER",
                    userId: 7,
                    userName: "Roi",
                    playerInId: 10,
                    playerOutId: 20,
                }]}
            />,
        );

        expect(screen.getByText("Roi")).toBeInTheDocument();
        expect(screen.getByText("Cole Palmer")).toBeInTheDocument();
        expect(screen.getByText("Bukayo Saka")).toBeInTheDocument();
        expect(screen.getByText("Waiver")).toBeInTheDocument();
    });

    it("renders a stable empty state before the first move", () => {
        render(<TransferActivityTable players={PLAYERS} />);
        expect(screen.getByText("No moves yet")).toBeInTheDocument();
    });

    it("renders supplemental draft activity as a replacement rather than an initial pick", () => {
        render(
            <TransferActivityTable
                mode="supplemental"
                players={PLAYERS}
                actions={[{
                    id: 92,
                    source: "DRAFT",
                    userName: "Roi",
                    playerInId: 10,
                    playerOutId: 20,
                }]}
            />,
        );

        expect(screen.getByText("Cole Palmer")).toBeInTheDocument();
        expect(screen.getByText("Bukayo Saka")).toBeInTheDocument();
        expect(screen.getByText("Draft move 1")).toBeInTheDocument();
    });
});
