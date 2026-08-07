import { createContext, useContext, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../services/apiClient";
import { queryKeys } from "../lib/query/keys";

const FixturesContext = createContext();

export function FixturesProvider({ children }) {
    const queryClient = useQueryClient();

    const getFixturesForTeam = useCallback(async (teamId) => {
        if (!teamId) return {};

        try {
            return await queryClient.fetchQuery({
                queryKey: queryKeys.teamFixtures(teamId),
                queryFn: () => apiRequest(`/api/fixtures/team/${teamId}`),
                staleTime: 5 * 60_000,
            });
        } catch (err) {
            console.error("Error fetching fixtures:", err);
            return {};
        }
    }, [queryClient]);

    return (
        <FixturesContext.Provider value={{ getFixturesForTeam }}>
            {children}
        </FixturesContext.Provider>
    );
}

export const useFixtures = () => useContext(FixturesContext);
