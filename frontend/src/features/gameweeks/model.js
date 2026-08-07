export function normalizeGameweekResponses([all, current, next, last]) {
    if (all.status === "rejected") {
        throw all.reason;
    }

    return {
        gameweeks: [...all.value].sort((left, right) => left.id - right.id),
        currentGameweek: current.status === "fulfilled" ? current.value : null,
        nextGameweek: next.status === "fulfilled" ? next.value : null,
        lastGameweek: last.status === "fulfilled" ? last.value : null,
    };
}
