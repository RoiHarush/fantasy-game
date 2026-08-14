import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Buttons from "./Buttons";
import LoadingPage from "./LoadingPage";
import Switcher from "./Switcher";

describe("shared general UI", () => {
    afterEach(() => cleanup());

    it("keeps the legacy Buttons callback API while using the shared button primitive", () => {
        const clicked = vi.fn();
        render(<Buttons names={["Confirm", "Cancel"]} clicked={clicked} />);

        fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
        expect(clicked).toHaveBeenCalledWith("Confirm");
    });

    it("exposes the active Switcher option through aria-pressed", () => {
        const onChange = vi.fn();
        render(<Switcher active="pitch" options={["pitch", "list"]} onChange={onChange} />);

        expect(screen.getByRole("button", { name: "pitch" })).toHaveAttribute("aria-pressed", "true");
        fireEvent.click(screen.getByRole("button", { name: "list" }));
        expect(onChange).toHaveBeenCalledWith("list");
    });

    it("renders the shared loader as a polite busy status", () => {
        render(<LoadingPage title="Building your squad" />);

        const status = screen.getByRole("status");
        expect(status).toHaveAttribute("aria-busy", "true");
        expect(screen.getByRole("heading", { name: "Building your squad" })).toBeInTheDocument();
        expect(screen.getByText("Loading…")).toHaveClass("sr-only");
    });
});
