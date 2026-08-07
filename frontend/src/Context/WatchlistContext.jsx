import { createContext, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../services/apiClient";
import { queryKeys } from "../lib/query/keys";

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = useMemo(
        () => queryKeys.watchlist(user?.id, user?.leagueId),
        [user?.id, user?.leagueId],
    );

    const { data: watchlist = [] } = useQuery({
        queryKey,
        queryFn: () => apiRequest(`/api/teams/${user.id}/watchlist`),
        enabled: Boolean(user?.id && user?.leagueId),
    });

    const mutation = useMutation({
        mutationFn: async ({ playerId, isWatched }) => {
            const endpoint = `/api/teams/${user.id}/watchlist/${isWatched ? "remove" : "add"}`;
            const method = isWatched ? "DELETE" : "POST";
            return apiRequest(endpoint, {
                method,
                body: { playerId },
            });
        },
        onMutate: async ({ playerId, isWatched }) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey) ?? [];
            queryClient.setQueryData(queryKey, isWatched
                ? previous.filter((id) => id !== playerId)
                : [...new Set([...previous, playerId])]
            );
            return { previous };
        },
        onError: (err, _variables, context) => {
            console.error("Failed to update watchlist:", err);
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

    return (
        <WatchlistContext.Provider value={{ watchlist, toggleWatch }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    return useContext(WatchlistContext);
}
