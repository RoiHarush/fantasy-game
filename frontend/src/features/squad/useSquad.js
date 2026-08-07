"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { fetchSquadForGameweek } from "../../services/squadService";

export function useSquad(userId, gameweekId, options = {}) {
    const { enabled = true } = options;

    return useQuery({
        queryKey: queryKeys.squad(userId, gameweekId),
        queryFn: ({ signal }) => fetchSquadForGameweek(userId, gameweekId, { signal }),
        enabled: Boolean(enabled && userId && gameweekId),
        staleTime: 30_000,
    });
}
