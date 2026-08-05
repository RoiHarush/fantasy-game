import { createContext, useContext, useEffect, useState, useCallback } from "react";
import API_URL from "../config";
import { useSystemStatus } from "./SystemStatusContext";
import { useAuth } from "./AuthContext";

const GameweekContext = createContext();

export function GameweekProvider({ children }) {
    const [gameweeks, setGameweeks] = useState([]);
    const [currentGameweek, setCurrentGameweek] = useState(null);
    const [nextGameweek, setNextGameweek] = useState(null);
    const [lastGameweek, setLastGameweek] = useState(null);

    const { isSystemLocked } = useSystemStatus();
    const { user } = useAuth();

    const fetchAllData = useCallback(() => {
        console.log("Fetching fresh Gameweek data...");

        fetch(`${API_URL}/api/gameweeks`)
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a, b) => a.id - b.id);
                setGameweeks(sorted);
            })
            .catch(err => console.error("Failed to fetch gameweeks:", err));

        fetch(`${API_URL}/api/gameweeks/current`)
            .then(res => res.json())
            .then(setCurrentGameweek)
            .catch(err => console.error("Failed to fetch current gameweek:", err));

        fetch(`${API_URL}/api/gameweeks/next`)
            .then(res => res.json())
            .then(setNextGameweek)
            .catch(err => console.error("Failed to fetch next gameweek:", err));

        fetch(`${API_URL}/api/gameweeks/last`)
            .then(res => res.json())
            .then(setLastGameweek)
            .catch(err => console.error("Failed to fetch last gameweek:", err));
    }, []);

    useEffect(() => {
        if (!user?.id) {
            setGameweeks([]);
            setCurrentGameweek(null);
            setNextGameweek(null);
            setLastGameweek(null);
            return;
        }

        if (!isSystemLocked) {
            fetchAllData();
        }
    }, [isSystemLocked, fetchAllData, user?.id]);

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