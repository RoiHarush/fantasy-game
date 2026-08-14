import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TransferActivityContent } from "./TransferActivityList";

const players = [
    { id: 11, viewName: "Saka" },
    { id: 12, viewName: "Haaland" },
    { id: 13, viewName: "Saliba" },
    { id: 14, viewName: "Palmer" },
];

describe("TransferActivityContent", () => {
    afterEach(() => cleanup());

    it("renders regular moves in action order and keeps IR releases separate", () => {
        render(
            <TransferActivityContent
                gameWeekId={6}
                players={players}
                actions={[
                    { id: 3, windowType: "TRANSFER", source: "IR_WAIVER", userName: "Roi", playerInId: 14, playerOutId: 13 },
                    { id: 2, windowType: "TRANSFER", source: "WAIVER", userName: "Dan", playerInId: 11, playerOutId: 12 },
                ]}
            />,
        );

        const regular = screen.getByRole("region", { name: "Regular window" });
        expect(within(regular).getByText("Saka")).toBeInTheDocument();
        expect(within(regular).getByText("Haaland")).toBeInTheDocument();

        const ir = screen.getByRole("region", { name: "IR activity" });
        expect(within(ir).getByText("Saliba")).toBeInTheDocument();
        expect(within(ir).queryByText("Palmer")).not.toBeInTheDocument();
        expect(within(ir).getByText("Waiver")).toBeInTheDocument();
    });
});
