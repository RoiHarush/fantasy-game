"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";

import { apiRequest } from "../services/apiClient";
import { queryKeys } from "../lib/query/keys";
import { useAuth } from "./AuthContext";
import { useSystemStatus } from "./SystemStatusContext";

const GameweekContext = createContext(null);

async function fetchGameweekState(signal) {
    const [all, current, next, last] = await Promise.allSettled([
        apiRequest("/api/gameweeks", { signal }),
        apiRequest("/api/gameweeks/current", { signal }),
        apiRequest("/api/gameweeks/next", { signal }),
        apiRequest("/api/gameweeks/last", { signal }),
    ]);

    if (all.status === "rejected") {
        throw all.reason;
    }

    return {
        gameweeks: [...all.value].sort((left, right) => left.id - right.id),
        currentGameweek: current.status === "fulfilled" ? current.value : null,
        nextGameweek: next.status === "fulfilled" ? next.value : null,
        lastGameweek: last.status === "fulfilled" ? last.value : null,
    };
}

const EMPTY_GAMEWEEK_STATE = {
    gameweeks: [],
    currentGameweek: null,
    nextGameweek: null,
    lastGameweek: null,
};

export function GameweekProvider({ children }) {
    const { isSystemLocked } = useSystemStatus();
    const { user } = useAuth();
    const enabled = Boolean(user?.id && !isSystemLocked);

    const query = useQuery({
        queryKey: queryKeys.gameweeks,
        queryFn: ({ signal }) => fetchGameweekState(signal),
        enabled,
        staleTime: 30_000,
    });

    const state = user?.id ? (query.data ?? EMPTY_GAMEWEEK_STATE) : EMPTY_GAMEWEEK_STATE;

    return (
        <GameweekContext.Provider value={{
            ...state,
            loading: enabled && query.isPending,
            error: query.error?.message ?? null,
            refreshGameweeks: query.refetch,
        }}>
            {children}
        </GameweekContext.Provider>
    );
}

export function useGameweek() {
    const context = useContext(GameweekContext);
    if (!context) {
        throw new Error("useGameweek must be used inside GameweekProvider");
    }
    return context;
}
