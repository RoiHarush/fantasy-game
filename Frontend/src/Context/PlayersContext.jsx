import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";

const PlayersContext = createContext();

export function PlayersProvider({ children }) {
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/players`)
            .then(res => res.json())
            .then(data => setPlayers(data))
            .catch(err => console.error("Failed to fetch players:", err));
    }, []);

    return (
        <PlayersContext.Provider value={{ players, setPlayers }}>
            {children}
        </PlayersContext.Provider>
    );
}

export function usePlayers() {
    return useContext(PlayersContext);
}
