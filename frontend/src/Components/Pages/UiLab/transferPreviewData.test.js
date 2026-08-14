import { describe, expect, it } from "vitest";

import { buildTransferWindowPreview } from "./transferPreviewData";

describe("buildTransferWindowPreview", () => {
    it("uses the real supplemental-draft pool in the active draft preview", () => {
        const players = [
            { id: 11, viewName: "New arrival", points: 0, supplementalDraftEligible: true },
            { id: 12, viewName: "Existing player", points: 100, supplementalDraftEligible: false },
        ];
        const users = [{ id: 1, name: "Manager" }];

        const preview = buildTransferWindowPreview({
            players,
            users,
            currentUser: users[0],
            squad: { startingLineup: {}, bench: {} },
            nextGameweek: { id: 1 },
            draftMode: true,
        });

        expect(preview.windowPlayers).toEqual([
            expect.objectContaining({ id: 11, supplementalDraftEligible: true, supplementalDraftSelectable: true }),
            expect.objectContaining({ id: 12, supplementalDraftEligible: false, supplementalDraftSelectable: false }),
        ]);
    });
});
