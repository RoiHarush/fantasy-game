export function getLeagueLeadingPlayerId(playerData) {
    return (playerData ?? []).find((player) => player.leagueGameweekLeader === true)?.playerId ?? null;
}
