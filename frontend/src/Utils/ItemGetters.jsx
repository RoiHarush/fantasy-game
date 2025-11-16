export function getPlayerById(players, playerId) {
    return players.find(p => p.id === playerId);
}



