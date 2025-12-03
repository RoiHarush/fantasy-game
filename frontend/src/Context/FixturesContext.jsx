import { createContext, useContext, useState, useCallback } from "react";
import API_URL from "../config";
import { getAuthHeaders } from "../services/authHelper";

const FixturesContext = createContext();

export function FixturesProvider({ children }) {
    const [cache, setCache] = useState({});

    const getFixturesForTeam = useCallback(async (teamId) => {
        if (!teamId) return {};

        if (cache[teamId]) return cache[teamId];

        try {
            const res = await fetch(`${API_URL}/api/fixtures/team/${teamId}`, {
                headers: getAuthHeaders()
            });

            if (!res.ok) throw new Error(`Failed to fetch fixtures for team ${teamId}`);
            const data = await res.json();

            setCache(prev => ({ ...prev, [teamId]: data }));
            return data;
        } catch (err) {
            console.error("Error fetching fixtures:", err);
            return {};
        }
    }, [cache]);

    return (
        <FixturesContext.Provider value={{ getFixturesForTeam }}>
            {children}
        </FixturesContext.Provider>
    );
}

export const useFixtures = () => useContext(FixturesContext);