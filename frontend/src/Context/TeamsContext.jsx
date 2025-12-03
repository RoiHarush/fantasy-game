import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";
import { getAuthHeaders } from "../services/authHelper";

const TeamsContext = createContext();

export function TeamsProvider({ children }) {
    const [teams, setTeams] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/teams`, {
            headers: getAuthHeaders()
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch teams");
                return res.json();
            })
            .then(data => {
                console.log("Teams loaded:", data.length);
                setTeams(data);
            })
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