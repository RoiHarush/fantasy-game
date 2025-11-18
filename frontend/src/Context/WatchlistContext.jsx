import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";
import { useWebSocket } from "./WebSocketContext";

const WatchlistContext = createContext();

export function WatchlistProvider({ user, children }) {
    const [watchlist, setWatchlist] = useState([]);
    const { subscribe, unsubscribe, connected } = useWebSocket();

    useEffect(() => {
        if (!user?.id) {
            setWatchlist([]);
            return;
        }

        const token = localStorage.getItem('token');

        fetch(`${API_URL}/api/users/${user.id}/watchlist`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error(res.statusText);
                return res.json();
            })
            .then(setWatchlist)
            .catch(err => console.error("Failed to fetch watchlist:", err));
    }, [user]);

    useEffect(() => {
        if (!connected || !user?.id) return;

        const sub = subscribe(`/topic/watchlist/${user.id}`, (msg) => {
            if (!msg.body || msg.body === "undefined") return;
            try {
                const updated = JSON.parse(msg.body);
                setWatchlist(Array.isArray(updated) ? updated : []);
            } catch (err) {
                console.error("Invalid JSON from WS:", msg.body);
            }
        });
        return () => unsubscribe(sub);
    }, [connected, user, subscribe, unsubscribe]);

    const toggleWatch = async (playerId, isWatched) => {
        setWatchlist((prev) => {
            if (isWatched) {
                return prev.filter((id) => id !== playerId);
            } else {
                return [...prev, playerId];
            }
        });

        try {
            const token = localStorage.getItem('token');
            const endpoint = `${API_URL}/api/users/${user.id}/watchlist/${isWatched ? "remove" : "add"}`;
            const method = isWatched ? "DELETE" : "POST";

            await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ playerId }),
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