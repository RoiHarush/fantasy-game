import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";

const PlayersContext = createContext();

export function PlayersProvider({ children }) {
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        let cancelled = false;

        async function loadPlayers() {
            try {
                const res = await fetch(`${API_URL}/api/players`);

                if (!res.ok) {
                    console.error(`Failed to fetch players: HTTP ${res.status}`);
                    return;
                }

                let data;
                try {
                    data = await res.json();
                } catch {
                    console.error("Bad JSON returned for /api/players");
                    return;
                }

                if (!cancelled) {
                    setPlayers(Array.isArray(data) ? data : []);
                }

            } catch (err) {
                console.error("Network error fetching players:", err);
            }
        }

        loadPlayers();
        return () => { cancelled = true; };
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
