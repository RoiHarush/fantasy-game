import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../services/apiClient";

const WatchlistContext = createContext();

export function WatchlistProvider({ children }) {
    const [watchlist, setWatchlist] = useState([]);

    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id || !user?.leagueId) {
            setWatchlist([]);
            return;
        }

        apiRequest(`/api/teams/${user.id}/watchlist`)
            .then(setWatchlist)
            .catch(console.error);
    }, [user]);

    const toggleWatch = async (playerId, isWatched) => {
        if (!user?.leagueId) {
            alert("Join a league before creating a watchlist");
            return;
        }

        setWatchlist((prev) => {
            if (isWatched) {
                return prev.filter((id) => id !== playerId);
            } else {
                return [...prev, playerId];
            }
        });

        try {
            const endpoint = `/api/teams/${user.id}/watchlist/${isWatched ? "remove" : "add"}`;
            const method = isWatched ? "DELETE" : "POST";

            await apiRequest(endpoint, {
                method,
                body: { playerId },
            });

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
