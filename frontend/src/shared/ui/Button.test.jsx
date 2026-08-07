import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
    it("renders an accessible button and forwards clicks", () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Save squad</Button>);

        fireEvent.click(screen.getByRole("button", { name: "Save squad" }));

        expect(onClick).toHaveBeenCalledOnce();
    });

    it("prevents interaction while disabled", () => {
        const onClick = vi.fn();
        render(<Button disabled onClick={onClick}>Saving</Button>);

        fireEvent.click(screen.getByRole("button", { name: "Saving" }));

        expect(onClick).not.toHaveBeenCalled();
    });
});
