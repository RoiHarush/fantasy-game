import { createContext, useContext, useRef, useCallback } from "react";
import { apiRequest } from "../services/apiClient";

const FixturesContext = createContext();

export function FixturesProvider({ children }) {
    const cache = useRef({});

    const getFixturesForTeam = useCallback(async (teamId) => {
        if (!teamId) return {};

        if (cache.current[teamId]) return cache.current[teamId];

        try {
            const data = await apiRequest(`/api/fixtures/team/${teamId}`);

            cache.current[teamId] = data;
            return data;
        } catch (err) {
            console.error("Error fetching fixtures:", err);
            return {};
        }
    }, []);

    return (
        <FixturesContext.Provider value={{ getFixturesForTeam }}>
            {children}
        </FixturesContext.Provider>
    );
}

export const useFixtures = () => useContext(FixturesContext);
