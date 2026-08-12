import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import SelectField from "./SelectField";

const originalHasPointerCapture = Element.prototype.hasPointerCapture;
const originalSetPointerCapture = Element.prototype.setPointerCapture;
const originalReleasePointerCapture = Element.prototype.releasePointerCapture;

beforeAll(() => {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
});

afterAll(() => {
    Element.prototype.hasPointerCapture = originalHasPointerCapture;
    Element.prototype.setPointerCapture = originalSetPointerCapture;
    Element.prototype.releasePointerCapture = originalReleasePointerCapture;
});

afterEach(cleanup);

describe("SelectField", () => {
    it("closes an open dropdown when its trigger is pressed again", () => {
        render(
            <SelectField
                value="all"
                onValueChange={vi.fn()}
                ariaLabel="Position"
                options={[
                    { value: "all", label: "All positions" },
                    { value: "GK", label: "Goalkeepers" },
                ]}
            />,
        );

        const trigger = screen.getByRole("combobox", { name: "Position" });
        fireEvent.keyDown(trigger, { key: "ArrowDown" });
        expect(trigger).toHaveAttribute("data-state", "open");

        fireEvent.pointerDown(trigger, { button: 0, pointerType: "touch" });
        expect(trigger).toHaveAttribute("data-state", "closed");
    });
});
