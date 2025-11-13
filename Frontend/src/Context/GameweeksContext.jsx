import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";

const GameweekContext = createContext();

export function GameweekProvider({ children }) {
    const [gameweeks, setGameweeks] = useState([]);
    const [currentGameweek, setCurrentGameweek] = useState(null);
    const [nextGameweek, setNextGameweek] = useState(null);
    const [lastGameweek, setLastGameweek] = useState(null);

    useEffect(() => {
        async function safeFetch(url, fallback = null) {
            try {
                const res = await fetch(url);
                if (!res.ok) {
                    console.error(`Fetch failed (${res.status}) for: ${url}`);
                    return fallback;
                }

                try {
                    return await res.json();
                } catch {
                    console.error(`Bad JSON for: ${url}`);
                    return fallback;
                }
            } catch (err) {
                console.error(`Network error for: ${url}`, err);
                return fallback;
            }
        }

        (async () => {
            const gw = await safeFetch(`${API_URL}/api/gameweeks`, []);
            setGameweeks(gw);

            const current = await safeFetch(`${API_URL}/api/gameweeks/current`, null);
            setCurrentGameweek(current);

            const next = await safeFetch(`${API_URL}/api/gameweeks/next`, null);
            setNextGameweek(next);

            const last = await safeFetch(`${API_URL}/api/gameweeks/last`, null);
            setLastGameweek(last);
        })();

    }, []);

    return (
        <GameweekContext.Provider value={{
            gameweeks,
            currentGameweek,
            nextGameweek,
            lastGameweek
        }}>
            {children}
        </GameweekContext.Provider>
    );
}

export function useGameweek() {
    return useContext(GameweekContext);
}
