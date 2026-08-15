import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
    default: (props) => {
        const imageProps = { ...props };
        delete imageProps.fill;
        delete imageProps.unoptimized;
        return createElement("img", imageProps);
    },
}));

import TeamIdentityImage from "./TeamIdentityImage";

describe("TeamIdentityImage", () => {
    it("fills a square crop so portrait uploads remain visually prominent", () => {
        render(<TeamIdentityImage src="/api/users/1/team-logo" alt="Draft FC logo" />);

        const image = screen.getByRole("img", { name: "Draft FC logo" });
        expect(image).toHaveClass("object-cover", "object-center");
        expect(image.parentElement).toHaveClass("aspect-square", "overflow-hidden");
    });
});
