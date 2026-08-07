import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSystemStatus } from "./SystemStatusContext";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../services/apiClient";

const GameweekContext = createContext();

export function GameweekProvider({ children }) {
    const [gameweeks, setGameweeks] = useState([]);
    const [currentGameweek, setCurrentGameweek] = useState(null);
    const [nextGameweek, setNextGameweek] = useState(null);
    const [lastGameweek, setLastGameweek] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { isSystemLocked } = useSystemStatus();
    const { user } = useAuth();

    const fetchAllData = useCallback(async (signal) => {
        console.log("Fetching fresh Gameweek data...");
        setLoading(true);
        setError(null);

        const results = await Promise.allSettled([
            apiRequest("/api/gameweeks", { signal }),
            apiRequest("/api/gameweeks/current", { signal }),
            apiRequest("/api/gameweeks/next", { signal }),
            apiRequest("/api/gameweeks/last", { signal }),
        ]);

        if (signal.aborted) return;

        const [all, current, next, last] = results;
        if (all.status === "fulfilled") {
            setGameweeks([...all.value].sort((a, b) => a.id - b.id));
        } else {
            setGameweeks([]);
            setError(all.reason?.message || "Failed to load gameweeks.");
        }

        setCurrentGameweek(current.status === "fulfilled" ? current.value : null);
        setNextGameweek(next.status === "fulfilled" ? next.value : null);
        setLastGameweek(last.status === "fulfilled" ? last.value : null);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!user?.id) {
            setGameweeks([]);
            setCurrentGameweek(null);
            setNextGameweek(null);
            setLastGameweek(null);
            setError(null);
            setLoading(false);
            return;
        }

        if (isSystemLocked) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        void fetchAllData(controller.signal);
        return () => controller.abort();
    }, [isSystemLocked, fetchAllData, user?.id]);

    return (
        <GameweekContext.Provider value={{
            gameweeks,
            currentGameweek,
            nextGameweek,
            lastGameweek,
            loading,
            error,
        }}>
            {children}
        </GameweekContext.Provider>
    );
}

export function useGameweek() {
    return useContext(GameweekContext);
}
