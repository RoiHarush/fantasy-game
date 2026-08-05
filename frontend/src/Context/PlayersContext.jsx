import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";
import { getAuthHeaders } from "../services/authHelper";
import { useAuth } from "./AuthContext";

const PlayersContext = createContext();

export function PlayersProvider({ children }) {
    const [players, setPlayers] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) {
            setPlayers([]);
            return;
        }

        fetch(`${API_URL}/api/players`, { headers: getAuthHeaders() })
            .then(res => res.json())
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
