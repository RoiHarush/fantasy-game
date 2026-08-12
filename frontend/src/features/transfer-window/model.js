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

export function getPlayerAcquisitionLockReason(player, { ruleLocked = false } = {}) {
    if (ruleLocked) {
        return "This pick would exceed a squad position or the three-player club limit";
    }
    if (player?.available) return null;
    if (player?.supplementalDraftEligible) {
        return "This player arrived after the last draft and is reserved for the next supplemental draft";
    }
    if (player?.ownerId !== null && player?.ownerId !== undefined) {
        return player.ownerName
            ? `Already owned by ${player.ownerName}`
            : "This player is already owned by another manager";
    }
    return "This player is locked by the league manager";
}

export function getReplacementBlockReason({ playerIn, playerOut, squadPlayers = [] }) {
    if (!playerIn || !playerOut) return "Player information is incomplete";
    if (isSameTransferId(playerIn.id, playerOut.id)) {
        return "Incoming and outgoing players must be different";
    }
    if (playerIn.position !== playerOut.position) {
        return "Players must have the same position";
    }

    const prospectiveClubCount = squadPlayers.filter((player) => (
        !isSameTransferId(player.id, playerOut.id)
        && isSameTransferId(player.teamId, playerIn.teamId)
    )).length + 1;

    if (prospectiveClubCount > 3) {
        return "Would exceed the three-player club limit";
    }
    return null;
}

export function summarizeSnakeOrder(order = [], users = [], turnsUsed = {}, totalTurns = {}) {
    const summaries = [];
    const byUserId = new Map();

    order.forEach((userId, index) => {
        const key = String(userId);
        let summary = byUserId.get(key);
        if (!summary) {
            const user = users.find((candidate) => isSameTransferId(candidate.id, userId));
            summary = {
                id: userId,
                name: user?.name || user?.fantasyTeamName || "Unknown manager",
                pickNumbers: [],
                used: turnsUsed[userId] ?? turnsUsed[key] ?? 0,
                total: totalTurns[userId] ?? totalTurns[key] ?? 2,
            };
            byUserId.set(key, summary);
            summaries.push(summary);
        }
        summary.pickNumbers.push(index + 1);
    });

    return summaries;
}

export function buildFallbackSnakeOrder(baseOrder = [], totalTurns = {}) {
    const maxRounds = baseOrder.reduce((maximum, userId) => (
        Math.max(maximum, Number(totalTurns[userId] ?? totalTurns[String(userId)] ?? 0))
    ), 0);
    const rounds = [];

    for (let round = 0; round < maxRounds; round++) {
        const eligible = baseOrder.filter((userId) => (
            Number(totalTurns[userId] ?? totalTurns[String(userId)] ?? 0) > round
        ));
        rounds.push(...(round % 2 === 0 ? eligible : [...eligible].reverse()));
    }
    return rounds.length > 0 ? rounds : baseOrder;
}

export function getCurrentPickNumber(turnsUsed = {}, order = []) {
    if (order.length === 0) return null;
    const completedPicks = Object.values(turnsUsed)
        .reduce((total, used) => total + Number(used || 0), 0);
    return Math.min(order.length, completedPicks + 1);
}

export function validateTransferOrder(order, leagueUserIds, roundCount = 2, requireEqualDistribution = true) {
    const expectedLength = leagueUserIds.length * roundCount;
    if (order.length !== expectedLength) {
        return `Choose a manager for all ${expectedLength} transfer picks.`;
    }

    const unknownId = order.find((id) => (
        !leagueUserIds.some((userId) => isSameTransferId(userId, id))
    ));
    if (unknownId !== undefined) return "The transfer order contains an unknown manager.";

    if (requireEqualDistribution) {
        const invalidUserId = leagueUserIds.find((userId) => (
            order.filter((id) => isSameTransferId(id, userId)).length !== roundCount
        ));
        if (invalidUserId !== undefined) {
            return `Each manager must appear exactly ${roundCount} times.`;
        }
    }

    return null;
}

export function applyTransferWindowEvent(current = {}, event) {
    switch (event?.event) {
        case "window_opened":
            return {
                ...current,
                isOpen: true,
                isClosing: false,
                isDraftMode: event.isDraftMode ?? current.isDraftMode ?? false,
                draftType: event.draftType ?? current.draftType ?? null,
                currentUserId: event.userId ?? null,
                order: event.turnOrder ?? [],
                initialOrder: event.initialOrder ?? [],
                canonicalOrder: event.canonicalOrder ?? event.initialOrder ?? [],
                turnsUsed: event.turnsUsed ?? {},
                totalTurns: event.totalTurns ?? current.totalTurns ?? {},
                currentRound: event.roundType ?? "REGULAR",
                irPosition: null,
            };
        case "window_closed":
            return {
                ...current,
                isOpen: false,
                isClosing: false,
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

export function transferActionToNotice(action) {
    if (!action) return null;
    return {
        event: "transfer_done",
        userId: action.userId,
        userName: action.userName,
        playerInId: action.playerInId,
        playerOutId: action.playerOutId,
    };
}

export function getTransferNoticeMessage(event, players, isDraftMode) {
    const details = getTransferNoticeDetails(event, players, isDraftMode);
    if (!details) return null;
    if (details.type === "pass") return `${details.managerName} passed the turn`;
    if (details.type === "draft") return `${details.managerName} selected ${details.playerInName}`;
    return `${details.managerName}: ${details.playerInName} in, ${details.playerOutName} out`;
}

export function getTransferNoticeDetails(event, players, isDraftMode) {
    if (event?.event === "turn_passed") {
        return {
            type: "pass",
            managerName: event.userName || "Unknown manager",
        };
    }
    if (event?.event !== "transfer_done") return null;

    const playerIn = players.find((player) => isSameTransferId(player.id, event.playerInId));
    const playerOut = players.find((player) => isSameTransferId(player.id, event.playerOutId));
    return {
        type: isDraftMode ? "draft" : "transfer",
        managerName: event.userName || "Unknown manager",
        playerInName: playerIn?.viewName ?? "Unknown player",
        playerOutName: playerOut?.viewName ?? "Unknown player",
    };
}
