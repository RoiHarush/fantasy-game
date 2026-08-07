"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { getFixtures, getTeamFixtures } from "./api";

export function useFixtures() {
    return useQuery({
        queryKey: queryKeys.allFixtures,
        queryFn: ({ signal }) => getFixtures({ signal }),
        staleTime: 5 * 60_000,
    });
}

export function useTeamFixtures(teamId) {
    return useQuery({
        queryKey: queryKeys.teamFixtures(teamId),
        queryFn: ({ signal }) => getTeamFixtures(teamId, { signal }),
        enabled: Boolean(teamId),
        staleTime: 5 * 60_000,
    });
}
