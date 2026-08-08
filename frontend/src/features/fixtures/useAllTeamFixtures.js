"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "../../lib/query/keys";
import { getTeamFixtures } from "./api";

export function useAllTeamFixtures(teams = []) {
    const queries = useQueries({
        queries: teams.map((team) => ({
            queryKey: queryKeys.teamFixtures(team.id),
            queryFn: ({ signal }) => getTeamFixtures(team.id, { signal }),
            staleTime: 5 * 60_000,
        })),
    });

    const isPending = teams.length > 0 && queries.some((query) => query.isPending);
    const error = queries.find((query) => query.error)?.error ?? null;
    const fixturesByTeam = useMemo(() => {
        if (teams.length === 0 || isPending || error) return null;
        return Object.fromEntries(
            teams.map((team, index) => [team.id, queries[index]?.data ?? {}]),
        );
    }, [error, isPending, queries, teams]);

    return { fixturesByTeam, isPending, error };
}
