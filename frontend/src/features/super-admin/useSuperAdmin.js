"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import {
    getAdminPlayers,
    getAdminUserDetails,
    getAdminUsers,
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
