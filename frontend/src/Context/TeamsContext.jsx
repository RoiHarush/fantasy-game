import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../services/apiClient";

const TeamsContext = createContext();

export function TeamsProvider({ children }) {
    const [teams, setTeams] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) {
            setTeams([]);
            return;
        }

        apiRequest("/api/teams")
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