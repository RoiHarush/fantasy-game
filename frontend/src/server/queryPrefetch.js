import "server-only";

import { dehydrate, QueryClient } from "@tanstack/react-query";

import { normalizeGameweekResponses } from "../features/gameweeks/model";
import { queryKeys } from "../lib/query/keys";
import { serverApiRequest } from "./api";

async function fetchInitialGameweekState() {
    const responses = await Promise.allSettled([
        serverApiRequest("/api/gameweeks"),
        serverApiRequest("/api/gameweeks/current"),
        serverApiRequest("/api/gameweeks/next"),
        serverApiRequest("/api/gameweeks/last"),
    ]);

    return normalizeGameweekResponses(responses);
}

export async function buildInitialQueryState(user) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: false } },
    });

    if (!user?.id || user.role === "ROLE_SUPER_ADMIN") return dehydrate(queryClient);

    const prefetches = [
        queryClient.prefetchQuery({
            queryKey: queryKeys.teams,
            queryFn: () => serverApiRequest("/api/teams"),
            staleTime: 5 * 60_000,
        }),
        queryClient.prefetchQuery({
            queryKey: queryKeys.players(user.leagueId),
            queryFn: () => serverApiRequest("/api/players"),
            staleTime: 60_000,
        }),
        queryClient.prefetchQuery({
            queryKey: queryKeys.gameweeks,
            queryFn: fetchInitialGameweekState,
            staleTime: 30_000,
        }),
    ];

    if (user.leagueId) {
        prefetches.push(queryClient.prefetchQuery({
            queryKey: queryKeys.watchlist(user.id, user.leagueId),
            queryFn: () => serverApiRequest(`/api/teams/${user.id}/watchlist`),
            staleTime: 30_000,
        }));
    }

    await Promise.allSettled(prefetches);
    return dehydrate(queryClient);
}
