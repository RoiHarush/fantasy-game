import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../services/apiClient";
import { queryKeys } from "../lib/query/keys";

const TeamsContext = createContext();

export function TeamsProvider({ children }) {
    const { user } = useAuth();
    const { data: teams = [] } = useQuery({
        queryKey: queryKeys.teams,
        queryFn: () => apiRequest("/api/teams"),
        enabled: Boolean(user?.id),
        staleTime: 5 * 60_000,
    });

    return (
        <TeamsContext.Provider value={{ teams }}>
            {children}
        </TeamsContext.Provider>
    );
}

export function useTeams() {
    return useContext(TeamsContext);
}
