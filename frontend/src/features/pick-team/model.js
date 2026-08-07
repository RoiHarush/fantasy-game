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
    return starting.length + bench.length;
}

export function isFirstPickStarting(squad) {
    if (!squad?.firstPickId) return false;
    return Object.values(squad.startingLineup ?? {}).flat().includes(squad.firstPickId);
}
