"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useAuth } from "../../Context/AuthContext";
import { queryKeys } from "../../lib/query/keys";
import { addToWatchlist, getWatchlist, removeFromWatchlist } from "./api";
import { updateWatchlist } from "./model";

export function useWatchlist() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = useMemo(
        () => queryKeys.watchlist(user?.id, user?.leagueId),
        [user?.id, user?.leagueId],
    );

    const { data: watchlist = [] } = useQuery({
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
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey) ?? [];
            queryClient.setQueryData(
                queryKey,
                updateWatchlist(previous, playerId, isWatched),
            );
            return { previous };
        },
        onError: (error, _variables, context) => {
            console.error("Failed to update watchlist:", error);
            queryClient.setQueryData(queryKey, context?.previous ?? []);
            alert("Connection error: Could not update watchlist");
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey }),
    });

    const toggleWatch = (playerId, isWatched) => {
        if (!user?.leagueId) {
            alert("Join a league before creating a watchlist");
            return;
        }

        mutation.mutate({ playerId, isWatched });
    };

    return {
        watchlist,
        toggleWatch,
        isUpdating: mutation.isPending,
    };
}
