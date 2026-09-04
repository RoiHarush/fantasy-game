"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import {
    acceptTradeOffer,
    cancelTradeOffer,
    createTradeOffer,
    fetchTradeContext,
    fetchTradeOffers,
    rejectTradeOffer,
} from "./api";

export function useTradeContext(leagueId) {
    return useQuery({
        queryKey: queryKeys.tradeContext(leagueId),
        queryFn: ({ signal }) => fetchTradeContext({ signal }),
        enabled: Boolean(leagueId),
    });
}

export function useTradeOffers(leagueId) {
    return useQuery({
        queryKey: queryKeys.trades(leagueId),
        queryFn: ({ signal }) => fetchTradeOffers({ signal }),
        enabled: Boolean(leagueId),
    });
}

function useTradeMutation(leagueId, mutationFn) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: async () => Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.trades(leagueId) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.tradeContext(leagueId) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.players(leagueId) }),
            queryClient.invalidateQueries({ queryKey: queryKeys.leagueStandings(leagueId) }),
            queryClient.invalidateQueries({ queryKey: ["squad"] }),
        ]),
    });
}

export const useCreateTradeOffer = (leagueId) => useTradeMutation(leagueId, createTradeOffer);
export const useAcceptTradeOffer = (leagueId) => useTradeMutation(leagueId, acceptTradeOffer);
export const useRejectTradeOffer = (leagueId) => useTradeMutation(leagueId, rejectTradeOffer);
export const useCancelTradeOffer = (leagueId) => useTradeMutation(leagueId, cancelTradeOffer);
