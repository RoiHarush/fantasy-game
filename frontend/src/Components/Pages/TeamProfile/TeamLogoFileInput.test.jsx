import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TeamLogoFileInput from "./TeamLogoFileInput";

describe("TeamLogoFileInput", () => {
    it("uses the native mobile image picker and forwards the selected file", () => {
        const onChoose = vi.fn();
        render(<TeamLogoFileInput onChoose={onChoose} />);

        const input = screen.getByLabelText("Choose team image");
        const file = new File(["image"], "badge.jpg", { type: "image/jpeg" });

        expect(input).toHaveAttribute("type", "file");
        expect(input).toHaveAttribute("accept", "image/*");
        expect(input).not.toHaveClass("sr-only");
        expect(input).not.toHaveClass("opacity-0");

        fireEvent.change(input, { target: { files: [file] } });

        expect(onChoose).toHaveBeenCalledWith(file);
    });
});
