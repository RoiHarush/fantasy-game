import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
    default: (props) => {
        const imageProps = { ...props };
        delete imageProps.fill;
        delete imageProps.unoptimized;
        return createElement("img", imageProps);
    },
}));

import TableUser from "./TableUser";

afterEach(cleanup);

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
        const identity = screen.getByRole("link", { name: "View Roi FC points" });
        expect(identity.children[1].children[0]).toHaveTextContent("Roi FC");
        expect(identity.children[1].children[1]).toHaveTextContent("Roi");
    });

    it("uses an observer-specific points link when one is provided", () => {
        render(
            <TableUser
                user={{ id: 2, name: "Roi", fantasyTeamName: "Roi FC" }}
                currentUser={{ id: 1 }}
                pointsHref="/observe/4/2/points"
            />,
        );

        expect(screen.getByRole("link", { name: "View Roi FC points" }))
            .toHaveAttribute("href", "/observe/4/2/points");
    });
});
