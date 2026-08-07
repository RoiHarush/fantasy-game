export function getPlayerById(players, playerId) {
    return players.find((player) => player.id === playerId);
}
