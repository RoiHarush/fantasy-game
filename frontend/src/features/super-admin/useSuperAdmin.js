"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { getObservedLeague } from "./observerApi";
import {
    getAdminPlayers,
    getAdminUserDetails,
    getAdminUsers,
    getPlayerReplacementOptions,
    replacePlayerForManager,
    runAdminAction,
    updateAdminUser,
} from "./api";

export function useAdminUsers() {
    return useQuery({
        queryKey: queryKeys.adminUsers,
        queryFn: ({ signal }) => getAdminUsers({ signal }),
        staleTime: 30_000,
    });
}

export function useAdminUserDetails(userId) {
    return useQuery({
        queryKey: queryKeys.adminUserDetails(userId),
        queryFn: ({ signal }) => getAdminUserDetails(userId, { signal }),
        enabled: Boolean(userId),
    });
}

export function useUpdateAdminUser(userId, onSuccess) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (values) => updateAdminUser(userId, values),
        onSuccess: async (result) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers }),
                queryClient.invalidateQueries({ queryKey: queryKeys.adminUserDetails(userId) }),
            ]);
            onSuccess?.(result);
        },
    });
}

export function useAdminActionData() {
    const players = useQuery({
        queryKey: queryKeys.adminPlayers,
        queryFn: ({ signal }) => getAdminPlayers({ signal }),
        staleTime: 60_000,
    });
    const users = useAdminUsers();
    return { players, users };
}

export function useRunAdminAction(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: runAdminAction,
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gameweeks });
            queryClient.invalidateQueries({ queryKey: queryKeys.adminPlayers });
            queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
            options.onSuccess?.(response);
        },
        onError: options.onError,
    });
}

export function usePlayerReplacementOptions(leagueId, userId) {
    return useQuery({
        queryKey: ["admin", "player-replacement", leagueId, userId],
        queryFn: ({ signal }) => getPlayerReplacementOptions(leagueId, userId, { signal }),
        enabled: Boolean(leagueId && userId),
        staleTime: 10_000,
    });
}

export function usePlayerReplacementLeague(leagueId) {
    return useObservedLeague(leagueId, ["admin", "player-replacement", "league", leagueId]);
}

export function useObservedLeague(leagueId, queryKey = ["admin", "observe", "league", leagueId]) {
    return useQuery({
        queryKey,
        queryFn: () => getObservedLeague(leagueId),
        enabled: Boolean(leagueId),
        staleTime: 30_000,
    });
}

export function useReplacePlayerForManager(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: replacePlayerForManager,
        onSuccess: async (result) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["admin", "player-replacement"] }),
                queryClient.invalidateQueries({ queryKey: ["admin", "observe"] }),
                queryClient.invalidateQueries({ queryKey: ["players"] }),
                queryClient.invalidateQueries({ queryKey: ["squad"] }),
                queryClient.invalidateQueries({ queryKey: ["transfer-history"] }),
            ]);
            options.onSuccess?.(result);
        },
        onError: options.onError,
    });
}
