import { getPlayerById } from "./ItemGetters";

export function swapPlayersInSquad(squad, playerInId, playerOutId, players) {

    const newSquad = structuredClone ? structuredClone(squad) : JSON.parse(JSON.stringify(squad));

    if (Object.values(newSquad.bench).includes(playerInId) && Object.values(newSquad.bench).includes(playerOutId)) {
        swapInBench(newSquad, playerInId, playerOutId);
    } else if (Object.values(newSquad.bench).includes(playerInId)) {
        swapBetweenStartAndBench(newSquad, playerInId, playerOutId, players);
    } else {
        swapBetweenStartAndBench(newSquad, playerOutId, playerInId, players);
    }

    return newSquad;
}

export function swapBetweenStartAndBench(squad, playerInId, playerOutId, players) {
    const playerIn = getPlayerById(players, playerInId);   // הספסל
    const playerOut = getPlayerById(players, playerOutId); // ההרכב

    let benchKey = Object.keys(squad.bench).find(k => squad.bench[k] === playerInId);
    let outIdx = squad.startingLineup[playerOut.position].findIndex(id => id === playerOutId);

    if (!benchKey || outIdx === -1) return;

    // ------- SAME POSITION CASE -------
    if (playerIn.position === playerOut.position) {

        squad.startingLineup[playerOut.position][outIdx] = playerInId;

        squad.bench[benchKey] = playerOutId;

        return;
    }

    squad.bench[benchKey] = playerOutId;
    squad.startingLineup[playerIn.position].push(playerInId);

    squad.startingLineup[playerOut.position] =
        squad.startingLineup[playerOut.position].filter(id => id !== playerOutId);
}


export function swapInBench(squad, playerInId, playerOutId) {
    let inKey = Object.keys(squad.bench).find(k => squad.bench[k] === playerInId);
    let outKey = Object.keys(squad.bench).find(k => squad.bench[k] === playerOutId);

    if (!inKey || !outKey) return;

    squad.bench[inKey] = playerOutId;
    squad.bench[outKey] = playerInId;
}

export function getAllowedSwapIds(squad, playerId, players, firstPickUsed) {
    const squadRules = {
        minPlayersInPosition: {
            GK: 1,
            DEF: 3,
            MID: 2,
            FWD: 1
        }
    };

    const player = getPlayerById(players, playerId);

    let allowed = [];

    const squadPlayers = getSquadPlayers(squad);

    if (player.position === "GK") {
        allowed = squadPlayers.filter(id => getPlayerById(players, id).position === "GK");
    } else if (squad.startingLineup[player.position].includes(playerId)) {
        allowed = Object.values(squad.bench).filter(function (id) {
            const playerIn = getPlayerById(players, id);
            if (playerIn.position !== "GK") {
                if (playerIn.position === player.position)
                    return true;
                else if (
                    squad.startingLineup[player.position].length - 1 >=
                    squadRules.minPlayersInPosition[player.position]
                )
                    return true;
            }
            return false;
        });
    } else {
        allowed = squadPlayers.filter(function (id) {

            if (firstPickUsed && squad.firstPickId === id)
                return false;

            const playerOut = getPlayerById(players, id);
            if (playerOut.position === player.position)
                return true;
            else if (Object.values(squad.bench).includes(id)) {
                if (playerOut.position !== "GK")
                    return true;
                return false;
            } else if (
                squad.startingLineup[playerOut.position].length - 1 >= squadRules.minPlayersInPosition[playerOut.position])
                return true;
            return false;
        });
    }

    return allowed;
}

export function getSquadPlayers(squad) {
    return [...Object.values(squad.startingLineup).flat(), ...Object.values(squad.bench)];
}

