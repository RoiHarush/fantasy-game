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

import TableUser from "./TableUser";

describe("TableUser", () => {
    it("shows the manager team image next to their league entry", () => {
        render(
            <TableUser
                user={{ id: 2, name: "Roi", fantasyTeamName: "Roi FC", logoPath: "/api/users/2/team-logo?v=7" }}
                currentUser={{ id: 1 }}
            />,
        );

        expect(document.querySelector("img")).toHaveAttribute("src", "/api/users/2/team-logo?v=7");
        expect(screen.getByRole("link", { name: "View Roi FC points" })).toBeInTheDocument();
    });
});
