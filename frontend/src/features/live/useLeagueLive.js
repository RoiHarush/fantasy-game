"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../Context/AuthContext";
import { queryKeys } from "../../lib/query/keys";
import { getLeagueLive } from "./api";

export function useLeagueLive(enabled = true) {
    const { user } = useAuth();
    return useQuery({
        queryKey: queryKeys.leagueLive(user?.leagueId),
        queryFn: ({ signal }) => getLeagueLive({ signal }),
        enabled: Boolean(enabled && user?.leagueId),
        staleTime: 10_000,
        refetchInterval: 60_000,
    });
}
