import { cleanup, render, screen } from "@testing-library/react";
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
            incoming: [],
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

        expect(screen.getByText("Alex FC · Alex")).toBeInTheDocument();
    expect(screen.getByText(/Fri 4 Sep(?:t)? 13:06/)).toBeInTheDocument();
        expect(screen.getByText("Forward One")).toBeInTheDocument();
        expect(screen.getByText("Forward Two")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel offer" })).toBeEnabled();
    });
});
