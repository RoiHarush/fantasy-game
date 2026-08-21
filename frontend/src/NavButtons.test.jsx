import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
    pathname: "/status",
    logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    usePathname: () => navigationMocks.pathname,
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("./Context/AuthContext", () => ({
    useAuth: () => ({
        user: {
            id: 1,
            leagueId: 12,
            leagueStatus: "ACTIVE",
            leagueAdmin: true,
        },
        logout: navigationMocks.logout,
    }),
}));

import NavButtons from "./NavButtons";

describe("NavButtons responsive navigation", () => {
    beforeEach(() => {
        navigationMocks.pathname = "/status";
        navigationMocks.logout.mockReset();
        navigationMocks.logout.mockResolvedValue(undefined);
        Object.defineProperty(window, "scrollY", { configurable: true, writable: true, value: 0 });
        Object.defineProperty(window, "innerHeight", { configurable: true, writable: true, value: 600 });
        Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 1_200 });
    });

    afterEach(() => cleanup());

    it("keeps the important screens in the mobile quick navigation", () => {
        render(<NavButtons />);

        const quickNavigation = screen.getByRole("navigation", { name: "Mobile quick navigation" });
        expect(within(quickNavigation).getByRole("link", { name: "Status" })).toHaveAttribute("aria-current", "page");
        expect(within(quickNavigation).getByRole("link", { name: "Points" })).toHaveAttribute("href", "/points");
        expect(within(quickNavigation).getByRole("link", { name: "Team" })).toHaveAttribute("href", "/pick-team");
        expect(within(quickNavigation).getByRole("link", { name: "Scout" })).toHaveAttribute("href", "/scout");
        expect(within(quickNavigation).getByRole("link", { name: "Transfers" })).toHaveAttribute("href", "/transfer-window");
    });

    it("opens an accessible mobile menu for secondary screens", () => {
        render(<NavButtons />);

        const menuButton = screen.getByRole("button", { name: /open navigation menu.*status/i });
        fireEvent.click(menuButton);

        expect(menuButton).toHaveAttribute("aria-expanded", "true");

        const mobileNavigation = screen.getByRole("navigation", { name: "More navigation" });
        expect(within(mobileNavigation).queryByRole("link", { name: "Status" })).not.toBeInTheDocument();
        expect(within(mobileNavigation).getByRole("link", { name: "League" })).toHaveAttribute("href", "/league");
        expect(within(mobileNavigation).getByRole("link", { name: "League Control" })).toHaveAttribute("href", "/league-control");

        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.queryByRole("navigation", { name: "More navigation" })).not.toBeInTheDocument();
    });

    it("keeps logout available from the mobile menu", async () => {
        render(<NavButtons />);

        fireEvent.click(screen.getByRole("button", { name: /open navigation menu.*status/i }));
        fireEvent.click(within(screen.getByRole("navigation", { name: "More navigation" })).getByRole("button", { name: "Logout" }));

        await waitFor(() => expect(navigationMocks.logout).toHaveBeenCalledOnce());
        expect(screen.queryByRole("navigation", { name: "More navigation" })).not.toBeInTheDocument();
    });

    it("stays docked to the bottom without changing its layout while scrolling", () => {
        render(<NavButtons />);

        const quickNavigation = screen.getByRole("navigation", { name: "Mobile quick navigation" });
        expect(quickNavigation).toHaveClass("fixed", "inset-x-0", "bottom-0");

        window.scrollY = 120;
        fireEvent.scroll(window);
        expect(quickNavigation).toHaveClass("fixed", "inset-x-0", "bottom-0");
        expect(within(quickNavigation).getByText("Status")).toBeVisible();
    });

    it("reuses the manager navigation with observer-safe links and an exit action", () => {
        render(<NavButtons
            userOverride={{ id: 17, leagueId: 4, leagueStatus: "ACTIVE", leagueAdmin: false }}
            navigationBase="/observe/4/17"
            activePath="/pick-team"
            observerMode
        />);

        const quickNavigation = screen.getByRole("navigation", { name: "Mobile quick navigation" });
        expect(within(quickNavigation).getByRole("link", { name: "Team" })).toHaveAttribute("href", "/observe/4/17/pick-team");
        expect(within(quickNavigation).getByRole("link", { name: "Team" })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("link", { name: "Exit read-only view" })).toHaveAttribute("href", "/admin/observe");
        expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
    });
});
