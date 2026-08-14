import { describe, expect, it } from "vitest";

import {
    applyTransferWindowEvent,
    buildFallbackSnakeOrder,
    getCurrentPickNumber,
    getDraftRuleLockedIds,
    getPlayerAcquisitionLockReason,
    getReplacementBlockReason,
    getTransferNoticeDetails,
    getTransferNoticeMessage,
    getTurnsUntilUser,
    summarizeSnakeOrder,
    transferActionToNotice,
    updatePlayerOwnership,
    updateTransferNotice,
    validateTransferOrder,
} from "./model";

describe("transfer-window event model", () => {
    it("calculates turns using ids from either JSON representation", () => {
        expect(getTurnsUntilUser([1, 2, 3], "2", "1")).toBe(2);
        expect(getTurnsUntilUser([1, 2, 3], 2, 3)).toBe(1);
    });

    it("requires exactly two picks for every current league manager", () => {
        expect(validateTransferOrder([1, 2, 3, 1, 2, 3], [1, 2, 3])).toBeNull();
        expect(validateTransferOrder([1, 1, 1, 2, 2, 3], [1, 2, 3]))
            .toBe("Each manager must appear exactly 2 times.");
        expect(validateTransferOrder([1, 2], [1, 2, 3]))
            .toBe("Choose a manager for all 6 transfer picks.");
    });

    it("locks draft players when a position or club quota is full", () => {
        const players = [
            { id: 1, position: "GK", teamId: 10, available: false },
            { id: 2, position: "GK", teamId: 11, available: false },
            { id: 3, position: "GK", teamId: 12, available: true },
            { id: 4, position: "DEF", teamId: 10, available: false },
            { id: 5, position: "MID", teamId: 10, available: false },
            { id: 6, position: "FWD", teamId: 10, available: true },
        ];
        const squad = { startingLineup: { GK: ["1"], DEF: [4], MID: [5] }, bench: { GK: 2 } };

        expect(getDraftRuleLockedIds(players, squad, true)).toEqual(new Set([3, 6]));
        expect(getDraftRuleLockedIds(players, squad, false)).toEqual(new Set());
    });

    it("explains why a player cannot be acquired", () => {
        expect(getPlayerAcquisitionLockReason({ available: false, supplementalDraftEligible: true }))
            .toContain("arrived after the last draft");
        expect(getPlayerAcquisitionLockReason({ available: false, ownerId: 8, ownerName: "Dana" }))
            .toBe("Already owned by Dana");
        expect(getPlayerAcquisitionLockReason({ available: false, ownerId: null }))
            .toBe("This player is locked by the league manager");
        expect(getPlayerAcquisitionLockReason({ available: true })).toBeNull();
    });

    it("blocks only outgoing choices that would break the club limit", () => {
        const playerIn = { id: 20, position: "DEF", teamId: 5 };
        const squadPlayers = [
            { id: 1, position: "DEF", teamId: 5 },
            { id: 2, position: "MID", teamId: 5 },
            { id: 3, position: "FWD", teamId: 5 },
            { id: 4, position: "DEF", teamId: 9 },
        ];

        expect(getReplacementBlockReason({ playerIn, playerOut: squadPlayers[3], squadPlayers }))
            .toBe("Would exceed the three-player club limit");
        expect(getReplacementBlockReason({ playerIn, playerOut: squadPlayers[0], squadPlayers }))
            .toBeNull();
    });

    it("summarizes a snake order without duplicating managers", () => {
        const order = [1, 2, 3, 3, 2, 1];
        const summary = summarizeSnakeOrder(order, [
            { id: 1, name: "Roi" },
            { id: 2, name: "Dana" },
            { id: 3, name: "Noam" },
        ], { 1: 0, 2: 1, 3: 1 });

        expect(summary).toHaveLength(3);
        expect(summary[0]).toMatchObject({ name: "Roi", pickNumbers: [1, 6] });
        expect(summary[2]).toMatchObject({ name: "Noam", pickNumbers: [3, 4] });
        expect(getCurrentPickNumber({ 1: 0, 2: 1, 3: 1 }, order)).toBe(3);
        expect(buildFallbackSnakeOrder([1, 2, 3], { 1: 2, 2: 2, 3: 2 }))
            .toEqual(order);
    });

    it("adds live presence and planned absence to each manager summary", () => {
        const summary = summarizeSnakeOrder(
            [1, 2, 2, 1],
            [{ id: 1, name: "Roi" }, { id: 2, name: "Dana" }],
            {},
            {},
            { onlineUserIds: ["1"], automaticUserIds: [2] },
        );

        expect(summary[0]).toMatchObject({ id: 1, online: true, automatic: false });
        expect(summary[1]).toMatchObject({ id: 2, online: false, automatic: true });
    });

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

    it("keeps supplemental-draft identity until the window closes", () => {
        const opened = applyTransferWindowEvent({}, {
            event: "window_opened",
            isDraftMode: true,
            draftType: "SUPPLEMENTAL",
            userId: 4,
            turnOrder: [4, 7, 7, 4],
            initialOrder: [4, 7],
        });
        const closed = applyTransferWindowEvent(opened, { event: "window_closed" });

        expect(opened).toMatchObject({
            isOpen: true,
            isDraftMode: true,
            draftType: "SUPPLEMENTAL",
        });
        expect(closed).toMatchObject({
            isOpen: false,
            isDraftMode: false,
            draftType: null,
        });
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

    it("keeps the latest transfer notice during the live turn and clears it when the window closes", () => {
        const transfer = { event: "transfer_done", userName: "Roi", playerInId: 10, playerOutId: 20 };

        expect(updateTransferNotice(null, transfer)).toBe(transfer);
        expect(updateTransferNotice(transfer, { event: "turn_started" })).toBe(transfer);
        expect(updateTransferNotice(transfer, { event: "window_closed" })).toBeNull();
        expect(updateTransferNotice(transfer, { event: "ir_round_started" })).toBeNull();
        const noticePlayers = [
            { id: 10, viewName: "Player A" },
            { id: 20, viewName: "Player B" },
        ];
        expect(getTransferNoticeMessage(transfer, noticePlayers, false))
            .toBe("Roi: Player A in, Player B out");
        expect(getTransferNoticeDetails(transfer, noticePlayers, false)).toEqual({
            type: "transfer",
            managerName: "Roi",
            playerInName: "Player A",
            playerOutName: "Player B",
        });
    });

    it("converts persisted history into the same notice shape used by realtime events", () => {
        expect(transferActionToNotice({
            id: 18,
            userId: 2,
            userName: "Roi",
            playerInId: 10,
            playerOutId: 20,
            createdAt: "2026-08-11T20:15:00",
        })).toEqual({
            event: "transfer_done",
            userId: 2,
            userName: "Roi",
            playerInId: 10,
            playerOutId: 20,
        });
        expect(transferActionToNotice(null)).toBeNull();
    });

    it("shows a supplemental draft replacement as a full in-and-out move", () => {
        const players = [
            { id: 10, viewName: "New arrival" },
            { id: 20, viewName: "Released player" },
        ];

        expect(getTransferNoticeDetails({
            event: "transfer_done",
            userName: "Roi",
            playerInId: 10,
            playerOutId: 20,
        }, players, true)).toEqual({
            type: "transfer",
            managerName: "Roi",
            playerInName: "New arrival",
            playerOutName: "Released player",
        });
    });
});
