import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ClosedWindowView from "./ClosedWindowView";

afterEach(cleanup);

const BASE_PROPS = {
    gameweekId: 4,
    transferOpenTime: null,
    transferOrder: [
        { id: "1-10", pickNumber: 1, managerName: "Roi", isCurrentUser: true },
        { id: "2-11", pickNumber: 2, managerName: "Demo Manager" },
    ],
    orderPending: false,
    orderError: null,
    automaticAttendance: false,
    attendancePending: false,
    attendanceError: null,
    isLeagueAdmin: true,
    onAttendanceChange: vi.fn(),
    onManageOrder: vi.fn(),
    onOpenWindow: vi.fn(),
};

describe("ClosedWindowView", () => {
    it("renders the closed state and the exact upcoming order", () => {
        render(<ClosedWindowView {...BASE_PROPS} />);

        expect(screen.getByRole("heading", { name: "Transfer window is closed" })).toBeInTheDocument();
        expect(screen.getByText("Roi")).toBeInTheDocument();
        expect(screen.getByText("Demo Manager")).toBeInTheDocument();
        expect(screen.getByText("GW 4")).toBeInTheDocument();
        expect(screen.getByText("Your next pick")).toBeInTheDocument();
        expect(screen.getByText("#1")).toBeInTheDocument();
        expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Roi");
        expect(screen.getByRole("switch", { name: "I won’t attend this transfer window" })).not.toBeChecked();
        expect(screen.getByText("Off · You are expected to attend")).toBeInTheDocument();
    });

    it("describes automatic waivers only when absence is enabled", () => {
        render(<ClosedWindowView {...BASE_PROPS} automaticAttendance />);

        expect(screen.getByRole("switch", { name: "I won’t attend this transfer window" })).toBeChecked();
        expect(screen.getByText("Auto waivers enabled")).toBeInTheDocument();
    });

    it("keeps attendance and league actions wired through callbacks", () => {
        const onAttendanceChange = vi.fn();
        const onManageOrder = vi.fn();
        const onOpenWindow = vi.fn();

        render(
            <ClosedWindowView
                {...BASE_PROPS}
                onAttendanceChange={onAttendanceChange}
                onManageOrder={onManageOrder}
                onOpenWindow={onOpenWindow}
            />,
        );

        fireEvent.click(screen.getByRole("switch"));
        fireEvent.click(screen.getByRole("button", { name: /Manage order/i }));
        fireEvent.click(screen.getByRole("button", { name: /Open now/i }));

        expect(onAttendanceChange).toHaveBeenCalledOnce();
        expect(onManageOrder).toHaveBeenCalledOnce();
        expect(onOpenWindow).toHaveBeenCalledOnce();
    });
});
