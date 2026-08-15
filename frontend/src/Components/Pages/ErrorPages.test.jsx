import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RouteError from "../../shared/ui/RouteError";
import NotFoundPage from "./NotFoundPage";

describe("application error pages", () => {
    it("offers a route home when a page is not found", () => {
        render(<NotFoundPage />);

        expect(screen.getByRole("heading", { name: "Caught offside!" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Back to the pitch/ })).toHaveAttribute("href", "/");
    });

    it("can retry or return home after an internal error", () => {
        const reset = vi.fn();
        render(<RouteError reset={reset} />);

        fireEvent.click(screen.getByRole("button", { name: /Try again/ }));

        expect(reset).toHaveBeenCalledOnce();
        expect(screen.getByRole("heading", { name: /Sorry, it's not you/ })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Back home/ })).toHaveAttribute("href", "/");
    });
});
