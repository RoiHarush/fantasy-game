import players from "../MockData/Players";

export function getPlayerById(playerId) {
    return players.find(p => p.id === playerId);
}

