export function getPlayerById(players, playerId) {
    if (playerId === null || playerId === undefined) return undefined;
    return players.find((player) => String(player.id) === String(playerId));
}
