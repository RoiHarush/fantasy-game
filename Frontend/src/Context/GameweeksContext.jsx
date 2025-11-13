import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";

const GameweekContext = createContext();

export function GameweekProvider({ children }) {
    const [gameweeks, setGameweeks] = useState([]);
    const [currentGameweek, setCurrentGameweek] = useState(null);
    const [nextGameweek, setNextGameweek] = useState(null);
    const [lastGameweek, setLastGameweek] = useState(null);

    useEffect(() => {
        fetch(`${API_URL}/api/gameweeks`)
            .then(res => res.json())
            .then(setGameweeks)
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
