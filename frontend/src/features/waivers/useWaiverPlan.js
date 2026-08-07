"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { queryKeys } from "../../lib/query/keys";
import { fetchWaiverPlan, saveWaiverPlan } from "../../services/waiverService";

export function useWaiverPlan(gameweekId) {
    const queryClient = useQueryClient();
    const queryKey = useMemo(() => queryKeys.waiverPlan(gameweekId), [gameweekId]);
    const query = useQuery({
        queryKey,
        queryFn: () => fetchWaiverPlan(gameweekId),
        enabled: Boolean(gameweekId),
    });

    const mutation = useMutation({
        mutationFn: (entries) => saveWaiverPlan(gameweekId, entries),
        onMutate: async (entries) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey) ?? [];
            queryClient.setQueryData(queryKey, entries);
            return { previous };
        },
        onError: (_error, _entries, context) => {
            queryClient.setQueryData(queryKey, context?.previous ?? []);
        },
        onSuccess: (savedEntries) => {
            queryClient.setQueryData(queryKey, savedEntries ?? []);
        },
    });

    const setEntries = useCallback((updater) => {
        queryClient.setQueryData(queryKey, (current = []) => (
            typeof updater === "function" ? updater(current) : updater
        ));
    }, [queryClient, queryKey]);

    return {
        entries: query.data ?? [],
        setEntries,
        saveEntries: mutation.mutateAsync,
        loading: query.isPending && Boolean(gameweekId),
        saving: mutation.isPending,
        error: query.error ?? mutation.error ?? null,
    };
}
