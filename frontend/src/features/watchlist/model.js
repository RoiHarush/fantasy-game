export function updateWatchlist(current, playerId, isWatched) {
    if (isWatched) {
        return current.filter((id) => id !== playerId);
    }

    return current.includes(playerId) ? current : [...current, playerId];
}
