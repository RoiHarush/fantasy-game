"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { queryKeys } from "../../lib/query/keys";
import {
    fetchIrWaiverPlan,
    fetchWaiverPlan,
    saveIrWaiverPlan,
    saveWaiverPlan,
} from "../../services/waiverService";

const EMPTY_ENTRIES = [];

export function useWaiverPlan(gameweekId) {
    return usePlanQuery({
        gameweekId,
        queryKeyFactory: queryKeys.waiverPlan,
        fetchPlan: fetchWaiverPlan,
        savePlan: saveWaiverPlan,
    });
}

export function useIrWaiverPlan(gameweekId) {
    return usePlanQuery({
        gameweekId,
        queryKeyFactory: queryKeys.irWaiverPlan,
        fetchPlan: fetchIrWaiverPlan,
        savePlan: saveIrWaiverPlan,
    });
}

function usePlanQuery({ gameweekId, queryKeyFactory, fetchPlan, savePlan }) {
    const queryClient = useQueryClient();
    const queryKey = useMemo(() => queryKeyFactory(gameweekId), [gameweekId, queryKeyFactory]);
    const query = useQuery({
        queryKey,
        queryFn: () => fetchPlan(gameweekId),
        enabled: Boolean(gameweekId),
    });

    const mutation = useMutation({
        mutationFn: (entries) => savePlan(gameweekId, entries),
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
        entries: query.data ?? EMPTY_ENTRIES,
        setEntries,
        saveEntries: mutation.mutateAsync,
        loading: query.isPending && Boolean(gameweekId),
        saving: mutation.isPending,
        loadError: query.error ?? null,
        saveError: mutation.error ?? null,
    };
}
