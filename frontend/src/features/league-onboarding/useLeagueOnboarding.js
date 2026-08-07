"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { createLeague, getScoringDefaults, joinLeague } from "./api";

export function useScoringDefaults() {
    return useQuery({
        queryKey: queryKeys.scoringDefaults,
        queryFn: ({ signal }) => getScoringDefaults({ signal }),
        staleTime: Infinity,
    });
}

export function useCreateLeague(onSuccess) {
    return useMutation({ mutationFn: createLeague, onSuccess });
}

export function useJoinLeague(onSuccess) {
    return useMutation({ mutationFn: joinLeague, onSuccess });
}
