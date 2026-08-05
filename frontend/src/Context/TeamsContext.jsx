import { createContext, useContext, useEffect, useState } from "react";
import API_URL from "../config";
import { getAuthHeaders } from "../services/authHelper";
import { useAuth } from "./AuthContext";

const TeamsContext = createContext();

export function TeamsProvider({ children }) {
    const [teams, setTeams] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) {
            setTeams([]);
            return;
        }

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
    }, [user?.id]);

    return (
        <TeamsContext.Provider value={{ teams }}>
            {children}
        </TeamsContext.Provider>
    );
}

export function useTeams() {
    return useContext(TeamsContext);
}