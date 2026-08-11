"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { getDailyStatus, getDreamTeam, getIrStatuses, getPlayersOfTheWeek } from "./api";

export function useDailyStatus(gameweekId, enabled = true) {
    return useQuery({
        queryKey: queryKeys.dailyStatus(gameweekId),
        queryFn: ({ signal }) => getDailyStatus(gameweekId, { signal }),
        enabled: Boolean(enabled && gameweekId),
    });
}

export function useIrStatuses(enabled = true) {
    return useQuery({
        queryKey: queryKeys.irStatus,
        queryFn: ({ signal }) => getIrStatuses({ signal }),
        enabled,
        staleTime: 30_000,
    });
}

export function usePlayersOfTheWeek(enabled = true) {
    return useQuery({
        queryKey: queryKeys.playersOfTheWeek,
        queryFn: ({ signal }) => getPlayersOfTheWeek({ signal }),
        enabled,
        staleTime: 5 * 60_000,
    });
}

export function useDreamTeam(gameweekId, enabled = true) {
    return useQuery({
        queryKey: queryKeys.dreamTeam(gameweekId),
        queryFn: ({ signal }) => getDreamTeam(gameweekId, { signal }),
        enabled: Boolean(enabled && gameweekId),
        staleTime: 5 * 60_000,
    });
}
