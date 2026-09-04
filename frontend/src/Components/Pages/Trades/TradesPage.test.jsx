import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TradesPage from "./TradesPage";

vi.mock("../../../Context/AuthContext", () => ({
    useAuth: () => ({ user: { id: 10, leagueId: 2 } }),
}));

vi.mock("../../../features/trades/useTrades", () => ({
    useTradeContext: () => ({
        data: {
            available: true,
            currentUserId: 10,
            managers: [],
        },
        isLoading: false,
        isError: false,
    }),
    useTradeOffers: () => ({
        data: {
            incoming: [{
                id: 2,
                status: "ACCEPTED",
                proposer: { userId: 19, userName: "Alex", teamName: "Alex FC" },
                recipient: { userId: 10, userName: "Roi", teamName: "Roi FC" },
                items: [{
                    offeredPlayer: { id: 303, name: "Historic Midfielder", position: "MID", teamId: 3 },
                    requestedPlayer: { id: 404, name: "Other Midfielder", position: "MID", teamId: 4 },
                }],
                message: null,
                createdAt: [2026, 9, 3, 12, 0, 0],
                respondedAt: [2026, 9, 3, 12, 5, 0],
                canAccept: false,
                canReject: false,
                canCancel: false,
            }],
            outgoing: [{
                id: 1,
                status: "PENDING",
                proposer: { userId: 10, userName: "Roi", teamName: "Roi FC" },
                recipient: { userId: 19, userName: "Alex", teamName: "Alex FC" },
                items: [{
                    offeredPlayer: { id: 101, name: "Forward One", position: "FWD", teamId: 1 },
                    requestedPlayer: { id: 202, name: "Forward Two", position: "FWD", teamId: 2 },
                }],
                message: "Deal?",
                createdAt: [2026, 9, 4, 13, 6, 53, 781772350],
                canAccept: false,
                canReject: false,
                canCancel: true,
            }],
        },
        isLoading: false,
        isError: false,
    }),
    useCreateTradeOffer: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useAcceptTradeOffer: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
    useRejectTradeOffer: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
    useCancelTradeOffer: () => ({ mutateAsync: vi.fn(), isPending: false, variables: null }),
}));

vi.mock("../../General/PlayerKit", () => ({
    default: ({ teamId }) => <span data-testid={`kit-${teamId}`} />,
}));

afterEach(cleanup);

describe("TradesPage", () => {
    it("renders persisted offers whose backend timestamp is a Java date-time array", () => {
        render(<TradesPage />);

        expect(screen.getAllByText("Alex FC · Alex")).toHaveLength(2);
        expect(screen.getByText(/Fri 4 Sep(?:t)? 13:06/)).toBeInTheDocument();
        expect(screen.getByText("Forward One")).toBeInTheDocument();
        expect(screen.getByText("Forward Two")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel offer" })).toBeEnabled();
    });

    it("keeps completed offers in a collapsed trade history section", () => {
        render(<TradesPage />);

        const historySummary = screen.getByText("Trade history").closest("summary");
        const history = historySummary.closest("details");

        expect(history).not.toHaveAttribute("open");
        expect(history).toContainElement(screen.getByText("Historic Midfielder"));

        fireEvent.click(historySummary);

        expect(history).toHaveAttribute("open");
        expect(screen.getByText("accepted")).toBeInTheDocument();
    });
});
