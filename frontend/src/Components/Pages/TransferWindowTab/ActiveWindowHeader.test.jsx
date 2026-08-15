import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ActiveWindowHeader from "./ActiveWindowHeader";

describe("ActiveWindowHeader", () => {
    it("shows every manager's attendance choice alongside live presence", () => {
        render(
            <ActiveWindowHeader
                title="Transfer window live"
                isDraftMode={false}
                isSupplementalDraft={false}
                isIrRound={false}
                isClosing={false}
                currentUserId={1}
                currentUserName="Manager One"
                currentUserAutomatic={false}
                viewingUser={{ id: 1 }}
                currentPickNumber={1}
                totalPicks={4}
                turnsLeft={0}
                managerSummaries={[
                    { id: 1, name: "Manager One", online: true, active: true, automatic: false, used: 0, total: 2, pickNumbers: [1, 4] },
                    { id: 2, name: "Manager Two", online: false, active: false, automatic: true, used: 0, total: 2, pickNumbers: [2, 3] },
                ]}
                lastTransferNotice={null}
                passPending={false}
                skipPending={false}
            />,
        );

        expect(screen.getByText("Attending")).toBeInTheDocument();
        expect(screen.getByText("Not attending · auto")).toBeInTheDocument();
    });
});
