import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DraftLobbyView from "./DraftLobbyView";

afterEach(cleanup);

const USERS = [
    { id: 1, name: "Roi" },
    { id: 2, name: "Demo Manager" },
];

const BASE_PROPS = {
    isAdmin: true,
    supplementalDraft: false,
    league: {
        id: 7,
        leagueCode: "FPL-2026",
        participantCount: 2,
        maxParticipants: 2,
    },
    users: USERS,
    rawDate: null,
    hasScheduledDraft: false,
    scheduledTime: "",
    orderSource: "TRANSFER_ORDER",
    manualPicks: [],
    orderError: "",
    actionError: null,
    actionPending: false,
    pendingAction: null,
    copied: false,
    copyError: "",
    onScheduledTimeChange: vi.fn(),
    onOrderSourceChange: vi.fn(),
    onManualPickChange: vi.fn(),
    onSchedule: vi.fn(),
    onPendingAction: vi.fn(),
    onConfirmationOpenChange: vi.fn(),
    onConfirmedAction: vi.fn(),
    onCopyCode: vi.fn(),
    onDraftTimeElapsed: vi.fn(),
};

describe("DraftLobbyView", () => {
    it("renders the initial closed draft as one readiness and setup flow", () => {
        render(<DraftLobbyView {...BASE_PROPS} />);

        expect(screen.getByRole("heading", { name: "Your draft room is ready" })).toBeInTheDocument();
        expect(screen.getByText("Not scheduled yet")).toBeInTheDocument();
        expect(screen.getByText("League ready")).toBeInTheDocument();
        expect(screen.getByText("FPL-2026")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Open draft now" })).toBeInTheDocument();
    });

    it("keeps scheduling, copying and opening wired through callbacks", () => {
        const onScheduledTimeChange = vi.fn();
        const onSchedule = vi.fn();
        const onCopyCode = vi.fn();
        const onPendingAction = vi.fn();

        render(
            <DraftLobbyView
                {...BASE_PROPS}
                scheduledTime="2027-01-26T20:30"
                onScheduledTimeChange={onScheduledTimeChange}
                onSchedule={onSchedule}
                onCopyCode={onCopyCode}
                onPendingAction={onPendingAction}
            />,
        );

        fireEvent.change(screen.getByLabelText("Draft date and time"), { target: { value: "2027-01-27T20:30" } });
        fireEvent.submit(screen.getByRole("button", { name: "Schedule draft" }).closest("form"));
        fireEvent.click(screen.getByRole("button", { name: "Copy league code" }));
        fireEvent.click(screen.getByRole("button", { name: "Open draft now" }));

        expect(onScheduledTimeChange).toHaveBeenCalledWith("2027-01-27T20:30");
        expect(onSchedule).toHaveBeenCalledOnce();
        expect(onCopyCode).toHaveBeenCalledOnce();
        expect(onPendingAction).toHaveBeenCalledWith("open");
    });

    it("shows supplemental order controls without exposing the old league code", () => {
        render(
            <DraftLobbyView
                {...BASE_PROPS}
                supplementalDraft
                league={{ ...BASE_PROPS.league, status: "ACTIVE" }}
                manualPicks={["", "", "", ""]}
            />,
        );

        expect(screen.getByRole("heading", { name: "Supplemental draft is waiting" })).toBeInTheDocument();
        expect(screen.getByText("Selection order")).toBeInTheDocument();
        expect(screen.queryByText("FPL-2026")).not.toBeInTheDocument();
        expect(screen.getByText("Two-round snake")).toBeInTheDocument();
    });
});
