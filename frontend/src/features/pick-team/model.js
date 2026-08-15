export function buildSaveTeamDto(squad) {
    return {
        startingLineup: squad.startingLineup,
        bench: squad.bench,
        formation: {
            GK: squad.startingLineup.GK?.length ?? 0,
            DEF: squad.startingLineup.DEF?.length ?? 0,
            MID: squad.startingLineup.MID?.length ?? 0,
            FWD: squad.startingLineup.FWD?.length ?? 0,
        },
        captainId: squad.captainId || null,
        viceCaptainId: squad.viceCaptainId || null,
        irId: squad.irId || null,
        firstPickId: squad.firstPickId || null,
    };
}

export function countSquadPlayers(squad) {
    if (!squad) return 0;
    const starting = Object.values(squad.startingLineup ?? {}).flat().filter(Boolean);
    const bench = Object.values(squad.bench ?? {}).filter(Boolean);
    return new Set([...starting, ...bench].map(String)).size;
}

export function isFirstPickStarting(squad) {
    if (!squad?.firstPickId) return false;
    return Object.values(squad.startingLineup ?? {}).flat()
        .some((playerId) => String(playerId) === String(squad.firstPickId));
}

export function getUnsavedSquadActionReason(hasUnsavedChanges, savePending, action = "using this chip") {
    if (savePending) return "Wait for your team changes to finish saving.";
    if (hasUnsavedChanges) return `Save your team changes before ${action}.`;
    return "";
}

export function getGameweekChipUnavailableReason({
    title,
    isActive,
    remaining,
    disabledReason = "",
    hasUnsavedChanges = false,
    savePending = false,
}) {
    const pendingSquadReason = getUnsavedSquadActionReason(hasUnsavedChanges, savePending);
    if (pendingSquadReason) return pendingSquadReason;
    if (isActive) return "";
    if ((remaining ?? 0) <= 0) return `No ${title} uses remain.`;
    return disabledReason;
}

export function getIrChipUnavailableReason({
    isActive,
    remaining,
    playersCount,
    transferWindowProcessed,
    hasUnsavedChanges = false,
    savePending = false,
}) {
    const pendingSquadReason = getUnsavedSquadActionReason(
        hasUnsavedChanges,
        savePending,
        "using an IR action",
    );
    if (pendingSquadReason) return pendingSquadReason;
    if (transferWindowProcessed) return "IR actions are unavailable after the deadline.";
    if (isActive && playersCount < 15) return "Your squad must contain 15 players before releasing IR.";
    if (!isActive && (remaining ?? 0) <= 0) return "No IR Chip uses remain.";
    return "";
}

export function getIrPlayerUnavailableReason({
    playerId,
    firstPickId,
    firstPickCaptainActive = false,
}) {
    if (
        firstPickCaptainActive
        && firstPickId != null
        && String(playerId) === String(firstPickId)
    ) {
        return "Cancel First Pick Captain before moving this player to IR.";
    }
    return "";
}
