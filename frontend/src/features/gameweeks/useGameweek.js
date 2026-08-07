"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../Context/AuthContext";
import { useSystemStatus } from "../../Context/SystemStatusContext";
import { queryKeys } from "../../lib/query/keys";
import { getGameweekState } from "./api";

const EMPTY_GAMEWEEK_STATE = {
    gameweeks: [],
    currentGameweek: null,
    nextGameweek: null,
    lastGameweek: null,
};

export function useGameweek() {
    const { isSystemLocked } = useSystemStatus();
    const { user } = useAuth();
    const enabled = Boolean(user?.id && !isSystemLocked);

    const query = useQuery({
        queryKey: queryKeys.gameweeks,
        queryFn: ({ signal }) => getGameweekState({ signal }),
        enabled,
        staleTime: 30_000,
    });

    const state = user?.id ? (query.data ?? EMPTY_GAMEWEEK_STATE) : EMPTY_GAMEWEEK_STATE;

    return {
        ...state,
        loading: enabled && query.isPending,
        error: query.error?.message ?? null,
        refreshGameweeks: query.refetch,
    };
}
