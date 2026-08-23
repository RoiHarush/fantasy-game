"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query/keys";
import { askAlex, generateAlexAnalysis, getAlexAnalysis } from "./api";

export const aiFeaturesEnabled = process.env.NEXT_PUBLIC_AI_FEATURES_ENABLED === "true";

export function useAlexCoach(gameweekId, enabled = true) {
    const queryClient = useQueryClient();
    const key = queryKeys.alexCoach(gameweekId);
    const query = useQuery({
        queryKey: key,
        queryFn: ({ signal }) => getAlexAnalysis(gameweekId, { signal }),
        enabled: Boolean(aiFeaturesEnabled && enabled && gameweekId),
        staleTime: 60_000,
        retry: false,
    });
    const analyze = useMutation({
        mutationFn: (payload) => generateAlexAnalysis(gameweekId, payload),
        onSuccess: (data) => queryClient.setQueryData(key, data),
    });
    const ask = useMutation({
        mutationFn: (message) => askAlex(gameweekId, message),
        onSuccess: (data) => queryClient.setQueryData(key, data),
    });
    return { ...query, analysis: query.data, analyze, ask };
}
