"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import {
    fetchUserHistory,
    fetchUserPoints,
    fetchUserTotalPoints,
} from "../../services/pointsService";

export function useUserGameweekPoints(userId, gameweekId, enabled = true) {
    return useQuery({
        queryKey: queryKeys.userGameweekPoints(userId, gameweekId),
        queryFn: ({ signal }) => fetchUserPoints(userId, gameweekId, { signal }),
        enabled: Boolean(enabled && userId && gameweekId),
    });
}

export function useUserTotalPoints(userId, enabled = true) {
    return useQuery({
        queryKey: queryKeys.userTotalPoints(userId),
        queryFn: ({ signal }) => fetchUserTotalPoints(userId, { signal }),
        enabled: Boolean(enabled && userId),
        staleTime: 30_000,
    });
}

export function usePointsHistory(userId) {
    return useQuery({
        queryKey: queryKeys.pointsHistory(userId),
        queryFn: ({ signal }) => fetchUserHistory(userId, { signal }),
        enabled: Boolean(userId),
        staleTime: 60_000,
    });
}
