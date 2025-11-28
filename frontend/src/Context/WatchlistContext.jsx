import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";
import { getAuthHeaders } from "../services/authHelper";
import { useAuth } from "./AuthContext";

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
    const [watchlist, setWatchlist] = useState([]);

    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) {
            setWatchlist([]);
            return;
        }

        fetch(`${API_URL}/api/users/${user.id}/watchlist`, {
            headers: getAuthHeaders()
        })
            .then(res => res.json())
            .then(setWatchlist)
            .catch(console.error);
    }, [user]);

    const toggleWatch = async (playerId, isWatched) => {
        setWatchlist((prev) => {
            if (isWatched) {
                return prev.filter((id) => id !== playerId);
            } else {
                return [...prev, playerId];
            }
        });

        try {
            const endpoint = `${API_URL}/api/users/${user.id}/watchlist/${isWatched ? "remove" : "add"}`;
            const method = isWatched ? "DELETE" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ playerId }),
            });

            if (!res.ok) throw new Error("Server updated failed");

        } catch (err) {
            console.error("Failed to update watchlist:", err);
            setWatchlist((prev) => {
                if (isWatched) {
                    return [...prev, playerId];
                } else {
                    return prev.filter((id) => id !== playerId);
                }
            });
            alert("Connection error: Could not update watchlist");
        }
    };

    return (
        <WatchlistContext.Provider value={{ watchlist, toggleWatch }}>
            {children}
        </WatchlistContext.Provider>
    );
}

export function useWatchlist() {
    return useContext(WatchlistContext);
}