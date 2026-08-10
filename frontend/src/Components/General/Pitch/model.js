const STARTING_POSITIONS = ["GK", "DEF", "MID", "FWD"];
const BENCH_SLOTS = ["GK", "S1", "S2", "S3"];

export function getLeadingPlayerId(squad, playerData) {
    if (!squad) return null;

    const pointsByPlayerId = new Map(
        (playerData ?? []).map((player) => [String(player.playerId), Number(player.points)]),
    );
    const orderedPlayerIds = [
        ...STARTING_POSITIONS.flatMap((position) => squad.startingLineup?.[position] ?? []),
        ...BENCH_SLOTS.map((slot) => squad.bench?.[slot]).filter(Boolean),
    ];

    let leaderId = null;
    let leaderPoints = 0;

    orderedPlayerIds.forEach((playerId) => {
        const rawPoints = pointsByPlayerId.get(String(playerId));
        const isCaptain = squad.captainId != null
            && String(squad.captainId) === String(playerId);
        const multiplier = isCaptain ? (squad.tripleCaptainActive ? 3 : 2) : 1;
        const contributionPoints = Number.isFinite(rawPoints) ? rawPoints * multiplier : null;

        if (contributionPoints != null && contributionPoints > leaderPoints) {
            leaderId = playerId;
            leaderPoints = contributionPoints;
        }
    });

    return leaderId;
}
