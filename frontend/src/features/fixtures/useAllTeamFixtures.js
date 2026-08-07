"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { useTeams } from "../teams/useTeams";
import { queryKeys } from "../../lib/query/keys";
import { getTeamFixtures } from "./api";

export function useAllTeamFixtures() {
    const { teams } = useTeams();
    const queries = useQueries({
        queries: teams.map((team) => ({
            queryKey: queryKeys.teamFixtures(team.id),
            queryFn: ({ signal }) => getTeamFixtures(team.id, { signal }),
            staleTime: 5 * 60_000,
        })),
    });

    return useMemo(() => {
        if (teams.length === 0 || queries.some((query) => query.isPending)) return null;
        return Object.fromEntries(
            teams.map((team, index) => [team.id, queries[index]?.data ?? {}]),
        );
    }, [queries, teams]);
}
