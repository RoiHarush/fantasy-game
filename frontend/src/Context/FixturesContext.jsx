import { createContext, useContext, useRef, useCallback } from "react";
import API_URL from "../config";
import { getAuthHeaders } from "../services/authHelper";

const FixturesContext = createContext();

export function FixturesProvider({ children }) {
    const cache = useRef({});

    const getFixturesForTeam = useCallback(async (teamId) => {
        if (!teamId) return {};

        if (cache.current[teamId]) return cache.current[teamId];

        try {
            const res = await fetch(`${API_URL}/api/fixtures/team/${teamId}`, {
                headers: getAuthHeaders()
            });

            if (!res.ok) throw new Error(`Failed to fetch fixtures for team ${teamId}`);
            const data = await res.json();

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
