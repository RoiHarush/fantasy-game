import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../services/apiClient";
import { queryKeys } from "../lib/query/keys";

const PlayersContext = createContext();

export function PlayersProvider({ children }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = useMemo(
        () => queryKeys.players(user?.leagueId),
        [user?.leagueId],
    );
    const { data: players = [] } = useQuery({
        queryKey,
        queryFn: () => apiRequest("/api/players"),
        enabled: Boolean(user?.id),
        staleTime: 60_000,
    });

    const setPlayers = useCallback((updater) => {
        queryClient.setQueryData(queryKey, (current = []) => (
            typeof updater === "function" ? updater(current) : updater
        ));
    }, [queryClient, queryKey]);

    return (
        <PlayersContext.Provider value={{ players, setPlayers }}>
            {children}
        </PlayersContext.Provider>
    );
}

export function usePlayers() {
    return useContext(PlayersContext);
}
