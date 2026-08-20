export function normalizeGameweekResponses([all, current, next, last]) {
    if (all.status === "rejected") {
        throw all.reason;
    }

    const gameweeks = [...all.value].sort((left, right) => left.id - right.id);
    const fulfilledBoundary = response => (
        response.status === "fulfilled"
        && response.value
        && typeof response.value === "object"
            ? response.value
            : null
    );
    const endpointCurrent = fulfilledBoundary(current);
    const endpointNext = fulfilledBoundary(next);
    const endpointLast = fulfilledBoundary(last);

    return {
        gameweeks,
        currentGameweek: endpointCurrent
            ?? gameweeks.find(gameweek => gameweek.status === "LIVE")
            ?? null,
        nextGameweek: endpointNext
            ?? gameweeks.find(gameweek => gameweek.status === "UPCOMING")
            ?? null,
        lastGameweek: endpointLast
            ?? [...gameweeks].reverse().find(gameweek => gameweek.status === "FINISHED")
            ?? null,
    };
}

export function getNextTransferGameweek({ gameweeks = [], nextGameweek = null } = {}) {
    return [...gameweeks]
        .filter(gameweek => gameweek.status === "UPCOMING"
            && Number(gameweek.id) >= 2
            && gameweek.transferWindowProcessed !== true
            && gameweek.transferOpenTime)
        .sort((left, right) => Number(left.id) - Number(right.id))[0]
        ?? (Number(nextGameweek?.id) >= 2
            && nextGameweek?.transferWindowProcessed !== true
            && nextGameweek?.transferOpenTime
            ? nextGameweek
            : null);
}
