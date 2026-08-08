"use client";

import { createContext, useContext, useMemo } from "react";

import { useTeams } from "../features/teams/useTeams";

const TeamsContext = createContext(null);

export function TeamsProvider({ children }) {
    const teamsQuery = useTeams();
    const value = useMemo(() => ({
        teams: teamsQuery.teams,
        teamsById: new Map(teamsQuery.teams.map((team) => [String(team.id), team])),
        isPending: teamsQuery.isPending,
        error: teamsQuery.error ?? null,
    }), [teamsQuery.error, teamsQuery.isPending, teamsQuery.teams]);

    return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
}

export function useTeamsContext() {
    const context = useContext(TeamsContext);
    if (!context) throw new Error("useTeamsContext must be used inside TeamsProvider");
    return context;
}

export function useTeam(teamId) {
    const { teamsById } = useTeamsContext();
    return teamsById.get(String(teamId));
}
