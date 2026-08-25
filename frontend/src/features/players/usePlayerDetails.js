"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { getPlayerMatchStats, getPlayerStats } from "./api";

export function usePlayerStats(playerId) {
    return useQuery({
        queryKey: queryKeys.playerStats(playerId),
        queryFn: ({ signal }) => getPlayerStats(playerId, { signal }),
        enabled: Boolean(playerId),
        staleTime: 5 * 60_000,
    });
}

export function usePlayerMatchStats(playerId, gameweekId, userId) {
    return useQuery({
        queryKey: queryKeys.playerMatch(playerId, gameweekId, userId),
        queryFn: ({ signal }) => getPlayerMatchStats(playerId, gameweekId, userId, { signal }),
        enabled: Boolean(playerId && gameweekId && userId),
        staleTime: 60_000,
        refetchOnMount: "always",
    });
}
