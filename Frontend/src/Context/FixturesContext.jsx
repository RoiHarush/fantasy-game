import { createContext, useContext, useState, useCallback } from "react";
import API_URL from "../config";

const FixturesContext = createContext();

export function FixturesProvider({ children }) {
    const [cache, setCache] = useState({}); // { teamId: fixtures }

    const getFixturesForTeam = useCallback(async (teamId) => {
        if (!teamId) return {};

        // clean cache read
        if (cache[teamId]) return cache[teamId];

        try {
            const res = await fetch(`${API_URL}/api/fixtures/team/${teamId}`);
            if (!res.ok) throw new Error("Failed to fetch fixtures");

            const data = await res.json();

            setCache(prev => ({
                ...prev,
                [teamId]: data
            }));

            return data;

        } catch (err) {
            console.error("Error fetching fixtures:", err);
            return {};
        }
    }, []); // 🎯 יציב תמיד


    return (
        <FixturesContext.Provider value={{ getFixturesForTeam }}>
            {children}
        </FixturesContext.Provider>
    );
}

export const useFixtures = () => useContext(FixturesContext);
