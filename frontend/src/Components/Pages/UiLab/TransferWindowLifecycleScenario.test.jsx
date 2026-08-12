import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import TransferWindowLifecycleScenario from "./TransferWindowLifecycleScenario";

vi.mock("../../PageLayout", () => ({
    default: ({ left, right }) => <div>{left}{right}</div>,
}));
vi.mock("../../Sidebar/TransferUserSidebar", () => ({
    default: () => <aside>Preview squad</aside>,
}));
vi.mock("../TransferWindowTab/ClosedWindowView", () => ({
    default: ({ onOpenWindow }) => (
        <section>
            <p>Production closed view</p>
            <button type="button" onClick={onOpenWindow}>Production open action</button>
        </section>
    ),
}));
vi.mock("../TransferWindowTab/TransferWindow", () => ({
    default: ({ allUsers, isClosing, previewLatestEvent, previewOnPass, previewTransferActions }) => (
        <section data-testid="production-live-view" data-closing={String(isClosing)}>
            Production live view · {previewTransferActions.length} moves · {allUsers.length} managers
            {previewLatestEvent?.event === "turn_passed" && <p>{previewLatestEvent.userName} passed the turn</p>}
            <button type="button" onClick={previewOnPass}>Pass</button>
        </section>
    ),
}));

const USERS = [
    { id: 1, name: "Roi", fantasyTeamName: "Roi FC" },
    { id: 2, name: "Demo", fantasyTeamName: "Demo FC" },
    { id: 3, name: "Test", fantasyTeamName: "Test FC" },
];
const PLAYERS = [
    { id: 10, viewName: "Goalkeeper A", position: "GK", points: 20 },
    { id: 11, viewName: "Goalkeeper B", position: "GK", points: 18 },
    { id: 12, viewName: "Goalkeeper C", position: "GK", points: 16 },
];
const SQUAD = {
    startingLineup: { GK: [10] },
    bench: { GK: 11 },
};
const PROPS = {
    previewUser: { ...USERS[0], leagueId: 1 },
    previewUsers: USERS,
    players: PLAYERS,
    teams: [],
    fixturesByTeam: {},
    nextGameweek: { id: 7, transferOpenTime: "2026-08-21T20:45:00" },
    squad: SQUAD,
};

afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
});

describe("TransferWindowLifecycleScenario", () => {
    it("opens and gracefully closes the real preview surfaces repeatedly", () => {
        vi.useFakeTimers();
        render(<TransferWindowLifecycleScenario {...PROPS} />);

        expect(screen.getByText("Production closed view")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /^Open$/i }));
        expect(screen.getByTestId("production-live-view")).toHaveAttribute("data-closing", "false");
        expect(screen.getByTestId("production-live-view")).toHaveTextContent("7 managers");

        act(() => vi.advanceTimersByTime(700));
        fireEvent.click(screen.getByRole("button", { name: "Pass" }));
        expect(screen.getByText("Roi passed the turn")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Final move \+ close/i }));
        expect(screen.getByTestId("production-live-view")).toHaveAttribute("data-closing", "true");
        expect(screen.getByTestId("production-live-view")).toHaveTextContent("1 moves");

        act(() => vi.advanceTimersByTime(5000));
        expect(screen.getByText("Production closed view")).toBeInTheDocument();
    });

    it("replays the deterministic full flow and returns to the start", () => {
        vi.useFakeTimers();
        render(<TransferWindowLifecycleScenario {...PROPS} />);

        fireEvent.click(screen.getByRole("button", { name: /Replay full flow/i }));
        act(() => vi.advanceTimersByTime(500));
        expect(screen.getByTestId("production-live-view")).toHaveAttribute("data-closing", "false");

        act(() => vi.advanceTimersByTime(4200));
        expect(screen.getByTestId("production-live-view")).toHaveAttribute("data-closing", "true");
        expect(screen.getByTestId("production-live-view")).toHaveTextContent("2 moves");

        act(() => vi.advanceTimersByTime(5000));
        expect(screen.getByText("Production closed view")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Replay full flow/i })).toBeEnabled();
    });
});
