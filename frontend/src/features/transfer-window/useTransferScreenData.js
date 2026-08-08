"use client";

import { useAllTeamFixtures } from "../fixtures/useAllTeamFixtures";
import { usePlayers } from "../players/usePlayers";
import { useTeams } from "../teams/useTeams";

export function useTransferScreenData(enabled) {
    const playersQuery = usePlayers({ enabled });
    const teamsQuery = useTeams({ enabled });
    const fixturesQuery = useAllTeamFixtures(enabled ? teamsQuery.teams : []);

    return {
        players: playersQuery.players,
        teams: teamsQuery.teams,
        fixturesByTeam: fixturesQuery.fixturesByTeam ?? {},
        isPending: Boolean(enabled && (
            playersQuery.isPending
            || teamsQuery.isPending
            || fixturesQuery.isPending
        )),
        error: playersQuery.error ?? teamsQuery.error ?? fixturesQuery.error ?? null,
    };
}
