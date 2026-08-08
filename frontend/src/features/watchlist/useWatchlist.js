"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useState } from "react";

import { useAuth } from "../../Context/AuthContext";
import { queryKeys } from "../../lib/query/keys";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "./api";
import { updateWatchlist } from "./model";

export function useWatchlist() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [clientError, setClientError] = useState(null);
    const queryKey = useMemo(
        () => queryKeys.watchlist(user?.id, user?.leagueId),
        [user?.id, user?.leagueId],
    );

    const query = useQuery({
        queryKey,
        queryFn: ({ signal }) => getWatchlist(user.id, { signal }),
        enabled: Boolean(user?.id && user?.leagueId),
    });

    const mutation = useMutation({
        mutationFn: ({ playerId, isWatched }) => (
            isWatched
                ? removeFromWatchlist(user.id, playerId)
                : addToWatchlist(user.id, playerId)
        ),
        onMutate: async ({ playerId, isWatched }) => {
            setClientError(null);
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey) ?? [];
            queryClient.setQueryData(
                queryKey,
                updateWatchlist(previous, playerId, isWatched),
            );
            return { previous };
        },
        onError: (_error, _variables, context) => {
            queryClient.setQueryData(queryKey, context?.previous ?? []);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey }),
    });

    const toggleWatch = (playerId, isWatched) => {
        if (!user?.leagueId) {
            setClientError(new Error("Join a league before creating a watchlist."));
            return;
        }

        mutation.mutate({ playerId, isWatched });
    };

    return {
        watchlist: query.data ?? [],
        toggleWatch,
        isUpdating: mutation.isPending,
        isPending: query.isPending && Boolean(user?.leagueId),
        error: clientError ?? query.error ?? mutation.error ?? null,
    };
}
