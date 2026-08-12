import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import PointsSummaryCard from "./PointsSummaryCard";

describe("PointsSummaryCard", () => {
    afterEach(() => cleanup());

    it("renders point values and delegates opening history", () => {
        const onOpenHistory = vi.fn();
        render(
            <PointsSummaryCard
                user={{ name: "Roi", fantasyTeamName: "Draft FC" }}
                gameweekPoints={58}
                totalPoints={714}
                onOpenHistory={onOpenHistory}
            />,
        );

        expect(screen.getByText("58")).toBeInTheDocument();
        expect(screen.getByText("714")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /View History/ }));
        expect(onOpenHistory).toHaveBeenCalledOnce();
    });

    it("keeps loading and error states accessible", () => {
        render(
            <PointsSummaryCard
                user={{ name: "Roi", fantasyTeamName: "Draft FC" }}
                pointsPending
                totalPending
                error={new Error("Unavailable")}
                onOpenHistory={() => {}}
            />,
        );

        expect(screen.getAllByText("…")).toHaveLength(2);
        expect(screen.getByRole("alert")).toHaveTextContent("temporarily unavailable");
    });
});
