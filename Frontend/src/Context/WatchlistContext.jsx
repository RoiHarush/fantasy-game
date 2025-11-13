import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";
import { useWebSocket } from "./WebSocketContext";

const WatchlistContext = createContext();

export function WatchlistProvider({ user, children }) {
    const [watchlist, setWatchlist] = useState([]);
    const { subscribe, unsubscribe, connected } = useWebSocket();

    useEffect(() => {
        if (!user?.id) return;

        let cancelled = false;

        async function loadWatchlist() {
            try {
                const res = await fetch(`${API_URL}/api/users/${user.id}/watchlist`);

                if (!res.ok) {
                    console.error(`Watchlist fetch failed: HTTP ${res.status}`);
                    return;
                }

                let data;
                try {
                    data = await res.json();
                } catch {
                    console.error("Bad JSON for watchlist");
                    return;
                }

                if (!cancelled) {
                    setWatchlist(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Network error fetching watchlist:", err);
            }
        }

        loadWatchlist();
        return () => (cancelled = true);

    }, [user]);


    // ----- WebSockets -----
    useEffect(() => {
        if (!connected || !user?.id) return;

        const sub = subscribe(`/topic/watchlist/${user.id}`, (msg) => {
            if (!msg.body || msg.body === "undefined") return;

            try {
                const updated = JSON.parse(msg.body);
                setWatchlist(Array.isArray(updated) ? updated : []);
            } catch {
                console.error("Invalid JSON from WS:", msg.body);
            }
        });

        return () => unsubscribe(sub);

    }, [connected, user, subscribe, unsubscribe]);


    // ----- Toggle -----
    const toggleWatch = async (playerId, isWatched) => {
        // optimistic UI
        setWatchlist((prev) => {
            return isWatched
                ? prev.filter((id) => id !== playerId)
                : [...prev, playerId];
        });

        try {
            const endpoint = `${API_URL}/api/users/${user.id}/watchlist/${isWatched ? "remove" : "add"}`;
            const method = isWatched ? "DELETE" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerId })
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

        } catch (err) {
            console.error("Failed to update watchlist:", err);

            // rollback
            setWatchlist((prev) => {
                return isWatched
                    ? [...prev, playerId]
                    : prev.filter((id) => id !== playerId);
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
