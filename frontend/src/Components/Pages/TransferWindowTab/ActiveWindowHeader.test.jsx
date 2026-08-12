import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ActiveWindowHeader from "./ActiveWindowHeader";

afterEach(cleanup);

const BASE_PROPS = {
    title: "Transfer window live",
    isDraftMode: false,
    isSupplementalDraft: false,
    isIrRound: false,
    isClosing: false,
    currentUserId: 2,
    currentUserName: "Demo Manager",
    currentUserAutomatic: false,
    viewingUser: { id: 1, leagueAdmin: true },
    currentPickNumber: 2,
    totalPicks: 6,
    turnsLeft: 2,
    managerSummaries: [
        { id: 1, name: "Roi", pickNumbers: [1, 6], used: 1, total: 2 },
        { id: 2, name: "Demo Manager", pickNumbers: [2, 5], used: 0, total: 2 },
        { id: 3, name: "Third Manager", pickNumbers: [3, 4], used: 0, total: 2 },
    ],
    lastTransferNotice: {
        type: "transfer",
        managerName: "Roi",
        playerInName: "Palmer",
        playerOutName: "Saka",
    },
    errorMessage: null,
    passPending: false,
    skipPending: false,
    onPass: vi.fn(),
    onSkip: vi.fn(),
};

describe("ActiveWindowHeader", () => {
    it("summarizes a snake order without duplicating managers", () => {
        render(<ActiveWindowHeader {...BASE_PROPS} />);

        expect(screen.getByText("1 · 6")).toBeInTheDocument();
        expect(screen.getByText("2 · 5")).toBeInTheDocument();
        expect(screen.queryByText("#1 · #6")).not.toBeInTheDocument();
        const snakeOrder = screen.getByRole("region", { name: "Snake order" });
        expect(within(snakeOrder).getAllByText("Roi")).toHaveLength(1);
        expect(within(snakeOrder).getAllByText("Demo Manager")).toHaveLength(1);
        expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Demo Manager");
    });

    it("keeps the league-manager skip action wired", () => {
        const onSkip = vi.fn();
        render(<ActiveWindowHeader {...BASE_PROPS} onSkip={onSkip} />);

        fireEvent.click(screen.getByRole("button", { name: "Skip manager" }));
        expect(onSkip).toHaveBeenCalledOnce();
    });

    it("gives the viewer a prominent distance to their next turn", () => {
        render(<ActiveWindowHeader {...BASE_PROPS} />);

        expect(screen.getByText("2 picks until your turn")).toBeInTheDocument();
        expect(screen.queryByText(/Your turn begins/)).not.toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Demo Manager is on the clock" })).toHaveClass("sm:h-[5.25rem]");
    });

    it("uses the shorter active-turn label", () => {
        render(<ActiveWindowHeader {...BASE_PROPS} currentUserId={1} />);

        expect(screen.getByText("Your turn")).toBeInTheDocument();
        expect(screen.queryByText("Your turn is active now")).not.toBeInTheDocument();
    });

    it("reserves the latest-activity area before the first move arrives", () => {
        render(<ActiveWindowHeader {...BASE_PROPS} lastTransferNotice={null} />);

        const activity = screen.getByRole("status", { name: "Latest transfer activity" });
        expect(within(activity).getByText("The latest move or pass will appear here.")).toBeInTheDocument();
        expect(activity).toHaveClass("h-32", "sm:h-24");
    });

    it("renders pass activity in the same stable area", () => {
        render(<ActiveWindowHeader {...BASE_PROPS} lastTransferNotice={{ type: "pass", managerName: "Roi" }} />);

        const activity = screen.getByRole("status", { name: "Latest transfer activity" });
        expect(within(activity).getByText("Roi")).toBeInTheDocument();
        expect(within(activity).getByText(/passed the turn/)).toBeInTheDocument();
    });

    it("shows the persisted final move while the closing transition is visible", () => {
        render(<ActiveWindowHeader {...BASE_PROPS} isClosing />);

        expect(screen.getByRole("heading", { name: "Window complete" })).toBeInTheDocument();
        const notice = screen.getByRole("status");
        expect(within(notice).getByText("Roi")).toBeInTheDocument();
        expect(within(notice).getByText("Palmer")).toBeInTheDocument();
        expect(within(notice).getByText("Saka")).toBeInTheDocument();
        expect(within(notice).getByText(/completed a transfer/)).toBeInTheDocument();
        expect(within(notice).getByText("Incoming")).toBeInTheDocument();
        expect(within(notice).getByText("Outgoing")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Skip manager" })).not.toBeInTheDocument();
    });
});
