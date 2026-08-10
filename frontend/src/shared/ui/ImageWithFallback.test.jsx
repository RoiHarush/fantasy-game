import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
    default: (props) => {
        const imageProps = { ...props };
        delete imageProps.fill;
        return createElement("img", imageProps);
    },
}));

import ImageWithFallback from "./ImageWithFallback";

describe("ImageWithFallback", () => {
    it("uses the fallback when no source is available", () => {
        render(<ImageWithFallback src={null} fallbackSrc="/fallback.svg" alt="Player" width={40} height={40} />);
        expect(screen.getByRole("img", { name: "Player" })).toHaveAttribute("src", "/fallback.svg");
    });

    it("switches to the fallback after the requested image fails", () => {
        render(<ImageWithFallback src="/missing.png" fallbackSrc="/fallback.svg" alt="Team" width={40} height={40} />);
        fireEvent.error(screen.getByRole("img", { name: "Team" }));
        expect(screen.getByRole("img", { name: "Team" })).toHaveAttribute("src", "/fallback.svg");
    });
});
