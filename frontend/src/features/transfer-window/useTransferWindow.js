"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import {
    fetchTransferHistory,
    fetchTransferOrder,
    fetchTransferWindowState,
    makeDraftPick,
    openTransferWindow,
    passTurn,
    saveTransferOrder,
    signIrPlayer,
    transferPlayer,
} from "../../services/transferWindowService";

export function useTransferWindowState(leagueId, options = {}) {
    return useQuery({
        queryKey: queryKeys.transferWindow(leagueId),
        queryFn: ({ signal }) => fetchTransferWindowState({ signal }),
        enabled: Boolean(leagueId && (options.enabled ?? true)),
        refetchInterval: options.refetchInterval,
    });
}

export function useTransferHistory(leagueId, gameweekId, options = {}) {
    return useQuery({
        queryKey: queryKeys.transferHistory(leagueId, gameweekId),
        queryFn: ({ signal }) => fetchTransferHistory(gameweekId, { signal }),
        enabled: Boolean(leagueId && gameweekId && (options.enabled ?? true)),
        staleTime: options.staleTime,
    });
}

export function useLatestTransferEvent(leagueId) {
    return useQuery({
        queryKey: queryKeys.transferEvent(leagueId),
        queryFn: () => null,
        enabled: false,
    });
}

export function useTransferOrder(leagueId, gameweekId) {
    return useQuery({
        queryKey: queryKeys.transferOrder(leagueId, gameweekId),
        queryFn: ({ signal }) => fetchTransferOrder(gameweekId, { signal }),
        enabled: Boolean(leagueId && gameweekId),
    });
}

export function useSaveTransferOrder(leagueId, gameweekId, options = {}) {
    const queryClient = useQueryClient();
    const queryKey = queryKeys.transferOrder(leagueId, gameweekId);

    return useMutation({
        mutationFn: (order) => saveTransferOrder(gameweekId, order),
        onSuccess: (response, order) => {
            queryClient.setQueryData(queryKey, order);
            options.onSuccess?.(response, order);
        },
    });
}

export function useOpenTransferWindow(leagueId, gameweekId, options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => openTransferWindow(gameweekId),
        onSuccess: async (response) => {
            await queryClient.invalidateQueries({
                queryKey: queryKeys.transferWindow(leagueId),
            });
            options.onSuccess?.(response);
        },
    });
}

export function useTransferPlayer({ leagueId, userId, gameweekId, playerInId, onSuccess }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (playerOutId) => transferPlayer(playerOutId, playerInId),
        onSuccess: async (response) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.squad(userId, gameweekId) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.players(leagueId) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.transferHistory(leagueId, gameweekId) }),
            ]);
            onSuccess?.(response);
        },
    });
}

export function useSignIrPlayer({ leagueId, userId, onSuccess }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (playerId) => signIrPlayer(userId, playerId),
        onSuccess: async (response) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.players(leagueId) }),
                queryClient.invalidateQueries({ queryKey: ["squad", userId] }),
                queryClient.invalidateQueries({ queryKey: queryKeys.transferWindow(leagueId) }),
            ]);
            onSuccess?.(response);
        },
    });
}

export function usePassTransferTurn(userId) {
    return useMutation({ mutationFn: () => passTurn(userId) });
}

export function useDraftPlayer({ leagueId, userId, gameweekId, onSuccess }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: makeDraftPick,
        onSuccess: async (response) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.squad(userId, gameweekId) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.transferHistory(leagueId, gameweekId) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.players(leagueId) }),
            ]);
            onSuccess?.(response);
        },
    });
}
