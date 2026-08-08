export const isSameTransferId = (firstId, secondId) => (
    firstId !== null
    && firstId !== undefined
    && secondId !== null
    && secondId !== undefined
    && String(firstId) === String(secondId)
);

export function getTurnsUntilUser(turnOrder, currentUserId, targetUserId) {
    if (!turnOrder.length || currentUserId === null || currentUserId === undefined) return null;
    const currentIndex = turnOrder.findIndex((id) => isSameTransferId(id, currentUserId));
    const targetIndex = turnOrder.findIndex((id) => isSameTransferId(id, targetUserId));

    if (currentIndex === -1 || targetIndex === -1) return null;
    const difference = targetIndex - currentIndex;
    return difference >= 0 ? difference : turnOrder.length + difference;
}

export function getDraftRuleLockedIds(players, squad, isDraftMode) {
    if (!isDraftMode) return new Set();

    const rosterIds = [
        ...Object.values(squad?.startingLineup ?? {}).flat(),
        ...Object.values(squad?.bench ?? {}),
    ].filter((id) => id !== null && id !== undefined);
    const rosterPlayers = rosterIds
        .map((id) => players.find((player) => isSameTransferId(player.id, id)))
        .filter(Boolean);
    const positionLimits = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
    const positionCounts = {};
    const clubCounts = {};

    rosterPlayers.forEach((player) => {
        positionCounts[player.position] = (positionCounts[player.position] ?? 0) + 1;
        clubCounts[player.teamId] = (clubCounts[player.teamId] ?? 0) + 1;
    });

    return new Set(players
        .filter((player) => player.available)
        .filter((player) => (
            (positionCounts[player.position] ?? 0) >= (positionLimits[player.position] ?? 0)
            || (clubCounts[player.teamId] ?? 0) >= 3
        ))
        .map((player) => player.id));
}

export function validateTransferOrder(order, leagueUserIds, roundCount = 2) {
    const expectedLength = leagueUserIds.length * roundCount;
    if (order.length !== expectedLength) {
        return `Choose a manager for all ${expectedLength} transfer picks.`;
    }

    const unknownId = order.find((id) => (
        !leagueUserIds.some((userId) => isSameTransferId(userId, id))
    ));
    if (unknownId !== undefined) return "The transfer order contains an unknown manager.";

    const invalidUserId = leagueUserIds.find((userId) => (
        order.filter((id) => isSameTransferId(id, userId)).length !== roundCount
    ));
    if (invalidUserId !== undefined) {
        return `Each manager must appear exactly ${roundCount} times.`;
    }

    return null;
}

export function applyTransferWindowEvent(current = {}, event) {
    switch (event?.event) {
        case "window_opened":
            return {
                ...current,
                isOpen: true,
                isDraftMode: event.isDraftMode ?? current.isDraftMode ?? false,
                draftType: event.draftType ?? current.draftType ?? null,
                currentUserId: event.userId ?? null,
                order: event.turnOrder ?? [],
                initialOrder: event.initialOrder ?? [],
                turnsUsed: event.turnsUsed ?? {},
                totalTurns: event.totalTurns ?? current.totalTurns ?? {},
                currentRound: event.roundType ?? "REGULAR",
                irPosition: null,
            };
        case "window_closed":
            return {
                ...current,
                isOpen: false,
                isDraftMode: false,
                draftType: null,
                currentUserId: null,
                currentRound: null,
                irPosition: null,
            };
        case "turn_started":
            return {
                ...current,
                currentUserId: event.userId ?? null,
                order: event.turnOrder ?? current.order ?? [],
                turnsUsed: event.turnsUsed ?? current.turnsUsed ?? {},
                currentRound: event.roundType ?? current.currentRound,
            };
        case "ir_round_started":
            return {
                ...current,
                isOpen: true,
                currentUserId: event.userId ?? null,
                order: event.turnOrder ?? current.order ?? [],
                turnsUsed: event.turnsUsed ?? current.turnsUsed ?? {},
                currentRound: "IR",
                irPosition: event.irPosition ?? null,
            };
        case "transfer_done":
            return {
                ...current,
                turnsUsed: {
                    ...(current.turnsUsed ?? {}),
                    [event.userId]: ((current.turnsUsed ?? {})[event.userId] ?? 0) + 1,
                },
            };
        default:
            return current;
    }
}

export function updatePlayerOwnership(players, event) {
    if (event?.event !== "transfer_done") return players;

    return players.map((player) => {
        if (isSameTransferId(player.id, event.playerInId)) {
            return { ...player, available: false, ownerId: event.userId };
        }
        if (isSameTransferId(player.id, event.playerOutId)) {
            return { ...player, available: true, ownerId: null };
        }
        return player;
    });
}

export function updateTransferNotice(previous, event) {
    if (["window_opened", "window_closed", "ir_round_started"].includes(event?.event)) {
        return null;
    }
    if (["transfer_done", "turn_passed"].includes(event?.event)) {
        return event;
    }
    return previous;
}

export function getTransferNoticeMessage(event, players, isDraftMode) {
    if (event?.event === "turn_passed") {
        return `${event.userName || "User"} passed his turn!`;
    }
    if (event?.event !== "transfer_done") return null;

    const playerIn = players.find((player) => isSameTransferId(player.id, event.playerInId));
    const playerOut = players.find((player) => isSameTransferId(player.id, event.playerOutId));
    const inName = playerIn?.viewName ?? "Player In";
    const outName = playerOut?.viewName ?? "Player Out";

    return isDraftMode
        ? `${event.userName || "User"} drafted ${inName}`
        : `${event.userName || "User"} signed ${inName} | over ${outName}`;
}
