import { mockSquadRules } from "../MockData/Users";
import { getPlayerById } from "./ItemGetters";

export function swapPlayersInSquad(squad, playerInId, playerOutId) {
    const newSquad = structuredClone ? structuredClone(squad) : JSON.parse(JSON.stringify(squad));

    if (newSquad.bench.includes(playerInId) && newSquad.bench.includes(playerOutId)) {
        swapInBench(newSquad, playerInId, playerOutId);
    }
    else if (newSquad.bench.includes(playerInId)) {
        swapBetweenStartAndBench(newSquad, playerInId, playerOutId);
    }
    else {
        swapBetweenStartAndBench(newSquad, playerOutId, playerInId);
    }

    return newSquad;
}

export function swapBetweenStartAndBench(squad, playerInId, playerOutId) {
    const playerIn = getPlayerById(playerInId);
    const playerOut = getPlayerById(playerOutId);
    let inIdx = squad.bench.findIndex(id => id === playerInId);
    let outIdx = squad.startingLineup[playerOut.position].findIndex(id => id === playerOutId);

    if (inIdx === -1 || outIdx === -1) return;

    squad.bench[inIdx] = playerOutId;
    squad.startingLineup[playerIn.position].push(playerInId);

    squad.startingLineup[playerOut.position] =
        squad.startingLineup[playerOut.position].filter(id => id !== playerOutId);


}

export function swapInBench(squad, playerInId, playerOutId) {
    let inIdx = squad.bench.findIndex(id => id === playerInId);
    let outIdx = squad.bench.findIndex(id => id === playerOutId);

    if (inIdx === -1 || outIdx === -1) return;

    squad.bench[inIdx] = playerOutId;
    squad.bench[outIdx] = playerInId;
}



export function getAllowedSwapIds(squad, playerId, players) {
    const player = getPlayerById(playerId);
    let allowed = [];

    const squadPlayers = getSquadPlayers(squad);

    if (player.position === "GK") {
        allowed = squadPlayers.filter(id => getPlayerById(id).position === "GK");
    }
    else if (squad.startingLineup[player.position].includes(playerId)) {
        allowed = squad.bench.filter(function (id) {
            const playerIn = getPlayerById(id);
            if (playerIn.position !== "GK") {
                if (playerIn.position === player.position)
                    return true;
                else if (squad.startingLineup[player.position].length - 1 >= mockSquadRules.minPlayersInPosition[player.position])
                    return true;
            }
            return false;
        });
    } else {
        allowed = squadPlayers.filter(function (id) {
            const playerOut = getPlayerById(id);
            if (playerOut.position === player.position)
                return true;
            else if (squad.bench.includes(id)) {
                if (playerOut.position !== "GK")
                    return true;
                return false;
            } else if (squad.startingLineup[playerOut.position].length - 1 >= mockSquadRules.minPlayersInPosition[playerOut.position])
                return true;
            return false;

        });
        // allowed = allowed.filter(
        //     id => getPlayerById(id).position !== "GK)";
    }

    return allowed;
}

export function getSquadPlayers(squad) {
    return [...Object.values(squad.startingLineup).flat(), ...squad.bench];
}