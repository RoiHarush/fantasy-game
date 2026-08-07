import { getPlayerById } from "../../Utils/ItemGetters";

const MIN_STARTING_PLAYERS = {
    GK: 1,
    DEF: 3,
    MID: 2,
    FWD: 1,
};

function cloneSquad(squad) {
    return typeof structuredClone === "function"
        ? structuredClone(squad)
        : JSON.parse(JSON.stringify(squad));
}

export function getSquadPlayers(squad) {
    return [
        ...Object.values(squad.startingLineup).flat(),
        ...Object.values(squad.bench),
    ];
}

function swapInBench(squad, playerInId, playerOutId) {
    const inKey = Object.keys(squad.bench).find((key) => squad.bench[key] === playerInId);
    const outKey = Object.keys(squad.bench).find((key) => squad.bench[key] === playerOutId);

    if (!inKey || !outKey) return;

    squad.bench[inKey] = playerOutId;
    squad.bench[outKey] = playerInId;
}

function swapBetweenStartAndBench(squad, playerInId, playerOutId, players) {
    const playerIn = getPlayerById(players, playerInId);
    const playerOut = getPlayerById(players, playerOutId);
    const benchKey = Object.keys(squad.bench).find((key) => squad.bench[key] === playerInId);
    const outIndex = squad.startingLineup[playerOut.position].findIndex((id) => id === playerOutId);

    if (!benchKey || outIndex === -1) return;

    if (playerIn.position === playerOut.position) {
        squad.startingLineup[playerOut.position][outIndex] = playerInId;
        squad.bench[benchKey] = playerOutId;
        return;
    }

    squad.bench[benchKey] = playerOutId;
    squad.startingLineup[playerIn.position].push(playerInId);
    squad.startingLineup[playerOut.position] = squad.startingLineup[playerOut.position]
        .filter((id) => id !== playerOutId);
}

export function swapPlayersInSquad(squad, playerInId, playerOutId, players) {
    const updatedSquad = cloneSquad(squad);
    const benchIds = Object.values(updatedSquad.bench);

    if (benchIds.includes(playerInId) && benchIds.includes(playerOutId)) {
        swapInBench(updatedSquad, playerInId, playerOutId);
    } else if (benchIds.includes(playerInId)) {
        swapBetweenStartAndBench(updatedSquad, playerInId, playerOutId, players);
    } else {
        swapBetweenStartAndBench(updatedSquad, playerOutId, playerInId, players);
    }

    return updatedSquad;
}

export function getAllowedSwapIds(squad, playerId, players, firstPickUsed) {
    const player = getPlayerById(players, playerId);
    const squadPlayers = getSquadPlayers(squad);

    if (player.position === "GK") {
        return squadPlayers.filter((id) => getPlayerById(players, id).position === "GK");
    }

    if (squad.startingLineup[player.position].includes(playerId)) {
        return Object.values(squad.bench).filter((id) => {
            const incomingPlayer = getPlayerById(players, id);
            if (incomingPlayer.position === "GK") return false;
            if (incomingPlayer.position === player.position) return true;

            return squad.startingLineup[player.position].length - 1
                >= MIN_STARTING_PLAYERS[player.position];
        });
    }

    return squadPlayers.filter((id) => {
        if (firstPickUsed && squad.firstPickId === id) return false;

        const outgoingPlayer = getPlayerById(players, id);
        if (outgoingPlayer.position === player.position) return true;
        if (Object.values(squad.bench).includes(id)) {
            return outgoingPlayer.position !== "GK";
        }

        return squad.startingLineup[outgoingPlayer.position].length - 1
            >= MIN_STARTING_PLAYERS[outgoingPlayer.position];
    });
}

function findLeadershipFallback(startingIds, excludedIds) {
    return startingIds.find((id) => !excludedIds.includes(id)) ?? null;
}

export function applySquadSwap(squad, firstPlayerId, secondPlayerId, players) {
    const previousStartingIds = Object.values(squad.startingLineup).flat();
    const updatedSquad = swapPlayersInSquad(squad, firstPlayerId, secondPlayerId, players);
    const startingIds = Object.values(updatedSquad.startingLineup).flat();
    let { captainId, viceCaptainId } = updatedSquad;
    const { firstPickId } = updatedSquad;

    if (previousStartingIds.includes(firstPlayerId)) {
        if (captainId === firstPlayerId) {
            captainId = secondPlayerId !== firstPickId
                ? secondPlayerId
                : findLeadershipFallback(startingIds, [firstPlayerId, viceCaptainId, firstPickId]);
        }
        if (viceCaptainId === firstPlayerId) {
            viceCaptainId = secondPlayerId !== firstPickId
                ? secondPlayerId
                : findLeadershipFallback(startingIds, [firstPlayerId, captainId, firstPickId]);
        }
    } else {
        if (captainId === secondPlayerId) {
            captainId = firstPlayerId !== firstPickId
                ? firstPlayerId
                : findLeadershipFallback(startingIds, [secondPlayerId, viceCaptainId, firstPickId]);
        }
        if (viceCaptainId === secondPlayerId) {
            viceCaptainId = firstPlayerId !== firstPickId
                ? firstPlayerId
                : findLeadershipFallback(startingIds, [secondPlayerId, captainId, firstPickId]);
        }
    }

    return { ...updatedSquad, captainId, viceCaptainId };
}

export function assignCaptain(squad, playerId) {
    if (squad.viceCaptainId === playerId) {
        return {
            ...squad,
            captainId: playerId,
            viceCaptainId: squad.captainId,
        };
    }

    return { ...squad, captainId: playerId };
}

export function assignViceCaptain(squad, playerId) {
    if (squad.captainId === playerId) {
        return {
            ...squad,
            captainId: squad.viceCaptainId,
            viceCaptainId: playerId,
        };
    }

    return { ...squad, viceCaptainId: playerId };
}
