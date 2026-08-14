export function buildClosedTransferOrder(users, currentUserId) {
    const firstRound = users.map((manager) => manager.id);
    const snakeOrder = [...firstRound, ...firstRound.toReversed()];

    return snakeOrder.map((managerId, index) => {
        const manager = users.find((item) => String(item.id) === String(managerId));
        return {
            id: `preview-order-${index + 1}-${managerId}`,
            pickNumber: index + 1,
            managerName: manager?.name || manager?.fantasyTeamName || "Preview manager",
            isCurrentUser: String(managerId) === String(currentUserId),
        };
    });
}

export function buildTransferWindowPreview({
    players,
    users,
    currentUser,
    squad,
    nextGameweek,
    draftMode = false,
}) {
    const rankedPlayerIds = [...players]
        .sort((first, second) => (second.points ?? 0) - (first.points ?? 0))
        .slice(0, 4)
        .map((player) => String(player.id));
    const windowPlayers = draftMode
        ? players.map((player) => ({
            ...player,
            supplementalDraftSelectable: Boolean(player.supplementalDraftEligible),
        }))
        : players.map((player, index) => {
            const previewState = rankedPlayerIds.indexOf(String(player.id));
            if (previewState === 0) {
                return { ...player, available: true, ownerId: null, ownerName: null, supplementalDraftEligible: false };
            }
            if (previewState === 1) {
                return { ...player, available: false, ownerId: users[1]?.id, ownerName: users[1]?.name, supplementalDraftEligible: false };
            }
            if (previewState === 2) {
                return { ...player, available: false, ownerId: null, ownerName: null, supplementalDraftEligible: true };
            }
            if (previewState === 3) {
                return { ...player, available: false, ownerId: null, ownerName: null, supplementalDraftEligible: false };
            }
            return {
                ...player,
                available: index % 3 === 0,
                ownerId: index % 3 === 0 ? null : player.ownerId,
                ownerName: index % 3 === 0 ? null : player.ownerName,
                supplementalDraftEligible: false,
            };
        });
    const firstRound = users.map((manager) => manager.id).filter((id) => id !== undefined && id !== null);
    const previewSquadIds = squadPlayerIds(squad);
    const previewSquadIdSet = new Set(previewSquadIds.map(String));
    const incomingPlayers = players.filter((player) => (
        !previewSquadIdSet.has(String(player.id))
        && (!draftMode || player.supplementalDraftEligible)
    ));
    const sampleActions = firstRound.slice(0, 3).map((managerId, index) => {
        const incoming = incomingPlayers[index]
            ?? players.find((player) => !previewSquadIdSet.has(String(player.id)))
            ?? players[index];
        const outgoing = players.find((player) => (
            previewSquadIdSet.has(String(player.id))
            && String(player.id) !== String(incoming?.id)
            && player.position === incoming?.position
        ));
        const manager = users.find((item) => String(item.id) === String(managerId));
        return {
            id: `preview-transfer-${index + 1}`,
            windowType: draftMode ? "SUPPLEMENTAL" : "TRANSFER",
            userId: managerId,
            userName: manager?.name || manager?.fantasyTeamName || `Manager ${index + 1}`,
            playerInId: incoming?.id,
            playerOutId: draftMode ? undefined : outgoing?.id,
            source: index % 2 === 0 ? "MANUAL" : "WAIVER",
        };
    });
    const windowState = buildWindowState({
        users,
        currentUser,
        nextGameweek,
        draftMode,
        actionCount: 0,
    });

    return {
        windowPlayers,
        windowState,
        draftActions: draftMode ? sampleActions : [],
        transferActions: draftMode ? [] : sampleActions,
        sampleActions,
    };
}

export function buildWindowState({ users, currentUser, nextGameweek, draftMode = false, actionCount = 0 }) {
    const firstRound = users.map((manager) => manager.id).filter((id) => id !== undefined && id !== null);
    const snakeOrder = [...firstRound, ...firstRound.toReversed()];
    const consumedOrder = snakeOrder.slice(0, actionCount);
    const turnsUsed = Object.fromEntries(firstRound.map((managerId) => [
        managerId,
        consumedOrder.filter((usedId) => String(usedId) === String(managerId)).length,
    ]));

    return {
        isOpen: true,
        isDraftMode: draftMode,
        draftType: draftMode ? "SUPPLEMENTAL" : null,
        gameWeekId: nextGameweek.id,
        currentRound: "REGULAR",
        currentUserId: snakeOrder[actionCount] ?? null,
        currentUserAutomatic: false,
        order: snakeOrder.slice(actionCount),
        initialOrder: snakeOrder,
        canonicalOrder: snakeOrder,
        turnsUsed,
        totalTurns: Object.fromEntries(firstRound.map((managerId) => [managerId, 2])),
        viewingUserId: currentUser.id,
    };
}

export function squadPlayerIds(squad) {
    return [
        ...Object.values(squad?.startingLineup || {}).flat(),
        ...Object.values(squad?.bench || {}),
    ].filter(Boolean);
}
