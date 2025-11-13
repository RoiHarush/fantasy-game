import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";

const TeamsContext = createContext();

export function TeamsProvider({ children }) {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/teams`)
            .then(res => res.json())
            .then(data => setTeams(data))
            .catch(err => console.error("Failed to fetch teams:", err));
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
