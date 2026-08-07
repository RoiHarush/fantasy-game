import { describe, expect, it } from "vitest";

import {
    applyTransferWindowEvent,
    getTransferNoticeMessage,
    updatePlayerOwnership,
    updateTransferNotice,
} from "./model";

describe("transfer-window event model", () => {
    it("opens and advances a window from server events", () => {
        const opened = applyTransferWindowEvent({}, {
            event: "window_opened",
            userId: 4,
            turnOrder: [4, 7],
            initialOrder: [4, 7],
            turnsUsed: { 4: 0, 7: 0 },
        });
        const advanced = applyTransferWindowEvent(opened, {
            event: "turn_started",
            userId: 7,
            turnsUsed: { 4: 1, 7: 0 },
        });

        expect(opened).toMatchObject({ isOpen: true, currentUserId: 4, order: [4, 7] });
        expect(advanced).toMatchObject({ currentUserId: 7, turnsUsed: { 4: 1, 7: 0 } });
    });

    it("represents an IR round and then closes cleanly", () => {
        const irRound = applyTransferWindowEvent({ isOpen: true }, {
            event: "ir_round_started",
            userId: 9,
            irPosition: "DEF",
        });
        const closed = applyTransferWindowEvent(irRound, { event: "window_closed" });

        expect(irRound).toMatchObject({ currentRound: "IR", irPosition: "DEF" });
        expect(closed).toMatchObject({ isOpen: false, currentUserId: null, irPosition: null });
    });

    it("updates ownership without mutating the player cache", () => {
        const players = [
            { id: 10, available: true, ownerId: null },
            { id: 20, available: false, ownerId: 2 },
        ];
        const updated = updatePlayerOwnership(players, {
            event: "transfer_done",
            userId: 2,
            playerInId: 10,
            playerOutId: 20,
        });

        expect(updated).toEqual([
            { id: 10, available: false, ownerId: 2 },
            { id: 20, available: true, ownerId: null },
        ]);
        expect(players[0].available).toBe(true);
    });

    it("keeps the latest transfer notice across turn-start events", () => {
        const transfer = { event: "transfer_done", userName: "Roi", playerInId: 10, playerOutId: 20 };

        expect(updateTransferNotice(null, transfer)).toBe(transfer);
        expect(updateTransferNotice(transfer, { event: "turn_started" })).toBe(transfer);
        expect(updateTransferNotice(transfer, { event: "ir_round_started" })).toBeNull();
        expect(getTransferNoticeMessage(transfer, [
            { id: 10, viewName: "Player A" },
            { id: 20, viewName: "Player B" },
        ], false)).toBe("Roi signed Player A | over Player B");
    });
});
