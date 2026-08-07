import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../services/apiClient";

const PlayersContext = createContext();

export function PlayersProvider({ children }) {
    const [players, setPlayers] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) {
            setPlayers([]);
            return;
        }

        apiRequest("/api/players")
            .then(data => setPlayers(data))
            .catch(err => console.error("Failed to fetch players:", err));
    }, [user?.id, user?.leagueId]);

    return (
        <PlayersContext.Provider value={{ players, setPlayers }}>
            {children}
        </PlayersContext.Provider>
    );
}

export function usePlayers() {
    return useContext(PlayersContext);
}
