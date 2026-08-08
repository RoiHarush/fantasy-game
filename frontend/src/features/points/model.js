function sameGameweek(left, right) {
    return left?.id != null && right?.id != null && String(left.id) === String(right.id);
}

export function derivePointsGameweekView({
    gameweeks = [],
    currentGameweek,
    nextGameweek,
    lastGameweek,
    selectedGameweekId,
}) {
    const preSeason = !lastGameweek
        && !currentGameweek
        && nextGameweek?.status === "UPCOMING";
    const latestVisibleGameweek = currentGameweek ?? lastGameweek ?? null;
    const visibleGameweeks = latestVisibleGameweek
        ? gameweeks.filter((gameweek) => Number(gameweek.id) <= Number(latestVisibleGameweek.id))
        : [];
    const selectedGameweek = visibleGameweeks.find(
        (gameweek) => String(gameweek.id) === String(selectedGameweekId),
    );
    const effectiveGameweek = selectedGameweek ?? latestVisibleGameweek;
    const selectedIndex = visibleGameweeks.findIndex((gameweek) => sameGameweek(gameweek, effectiveGameweek));

    return {
        preSeason,
        effectiveGameweek,
        visibleGameweeks,
        selectedIndex,
        canGoPrevious: selectedIndex > 0,
        canGoNext: selectedIndex >= 0 && selectedIndex < visibleGameweeks.length - 1,
        isLive: sameGameweek(effectiveGameweek, currentGameweek),
    };
}
