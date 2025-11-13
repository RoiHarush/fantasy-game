import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";

const TeamsContext = createContext();

export function TeamsProvider({ children }) {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        let cancelled = false;

        async function loadTeams() {
            try {
                const res = await fetch(`${API_URL}/api/teams`);

                if (!res.ok) {
                    console.error(`Failed to fetch teams: HTTP ${res.status}`);
                    return;
                }

                let data;
                try {
                    data = await res.json();
                } catch {
                    console.error("Bad JSON returned for /api/teams");
                    return;
                }

                if (!cancelled) {
                    setTeams(Array.isArray(data) ? data : []);
                }

            } catch (err) {
                console.error("Network error fetching teams:", err);
            }
        }

        loadTeams();
        return () => { cancelled = true; };
    }, []);

    return (
        <TeamsContext.Provider value={{ teams }}>
            {children}
        </TeamsContext.Provider>
    );
}

export function useTeams() {
    return useContext(TeamsContext);
}
