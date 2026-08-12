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
    });

    afterEach(() => cleanup());

    it("opens an accessible mobile menu with the same navigation and active page", () => {
        render(<NavButtons />);

        const menuButton = screen.getByRole("button", { name: /open navigation menu.*status/i });
        fireEvent.click(menuButton);

        expect(menuButton).toHaveAttribute("aria-expanded", "true");

        const mobileNavigation = screen.getByRole("navigation", { name: "Mobile primary navigation" });
        expect(within(mobileNavigation).getByRole("link", { name: "Status" })).toHaveAttribute("aria-current", "page");
        expect(within(mobileNavigation).getByRole("link", { name: "League Control" })).toHaveAttribute("href", "/league-control");

        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.queryByRole("navigation", { name: "Mobile primary navigation" })).not.toBeInTheDocument();
    });

    it("keeps logout available from the mobile menu", async () => {
        render(<NavButtons />);

        fireEvent.click(screen.getByRole("button", { name: /open navigation menu.*status/i }));
        fireEvent.click(within(screen.getByRole("navigation", { name: "Mobile primary navigation" })).getByRole("button", { name: "Logout" }));

        await waitFor(() => expect(navigationMocks.logout).toHaveBeenCalledOnce());
        expect(screen.queryByRole("navigation", { name: "Mobile primary navigation" })).not.toBeInTheDocument();
    });
});
