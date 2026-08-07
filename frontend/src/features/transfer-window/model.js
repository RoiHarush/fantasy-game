export function applyTransferWindowEvent(current = {}, event) {
    switch (event?.event) {
        case "window_opened":
            return {
                ...current,
                isOpen: true,
                isDraftMode: event.isDraftMode ?? current.isDraftMode ?? false,
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
        if (player.id === event.playerInId) {
            return { ...player, available: false, ownerId: event.userId };
        }
        if (player.id === event.playerOutId) {
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

    const playerIn = players.find((player) => player.id === event.playerInId);
    const playerOut = players.find((player) => player.id === event.playerOutId);
    const inName = playerIn?.viewName ?? "Player In";
    const outName = playerOut?.viewName ?? "Player Out";

    return isDraftMode
        ? `${event.userName || "User"} drafted ${inName}`
        : `${event.userName || "User"} signed ${inName} | over ${outName}`;
}
