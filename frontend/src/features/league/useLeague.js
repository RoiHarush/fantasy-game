"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import {
    fetchLeague,
    fetchMaintenanceLeagues,
    fetchMaintenanceLeague,
    fetchMyLeague,
    removeLeagueMember,
    updateLeagueSettings,
    updateMaintenanceLeagueSettings,
} from "../../services/leagueService";
import { fetchAllUsers } from "../../services/usersService";

export function useLeagueStandings(leagueId, options = {}) {
    return useQuery({
        queryKey: queryKeys.leagueStandings(leagueId),
        queryFn: ({ signal }) => fetchLeague({ signal }),
        enabled: Boolean(leagueId && (options.enabled ?? true)),
        staleTime: options.staleTime ?? 30_000,
    });
}

export function useCurrentLeague(leagueId, options = {}) {
    return useQuery({
        queryKey: queryKeys.currentLeague(leagueId),
        queryFn: ({ signal }) => fetchMyLeague({ signal }),
        enabled: Boolean(leagueId && (options.enabled ?? true)),
        refetchInterval: options.refetchInterval,
    });
}

export function useMaintenanceLeague(leagueId) {
    return useQuery({
        queryKey: queryKeys.maintenanceLeague(leagueId),
        queryFn: ({ signal }) => fetchMaintenanceLeague(leagueId, { signal }),
        enabled: Boolean(leagueId),
    });
}

export function useMaintenanceLeagues() {
    return useQuery({
        queryKey: queryKeys.maintenanceLeagues,
        queryFn: fetchMaintenanceLeagues,
        staleTime: 30_000,
    });
}

export function useLeagueUsers(leagueId, options = {}) {
    return useQuery({
        queryKey: queryKeys.leagueUsers(leagueId),
        queryFn: ({ signal }) => fetchAllUsers({ signal }),
        enabled: Boolean(leagueId && (options.enabled ?? true)),
        staleTime: options.staleTime ?? 60_000,
    });
}

export function useUpdateLeagueSettings({ leagueId, maintenance = false, onSuccess }) {
    const queryClient = useQueryClient();
    const queryKey = maintenance
        ? queryKeys.maintenanceLeague(leagueId)
        : queryKeys.currentLeague(leagueId);

    return useMutation({
        mutationFn: (settings) => maintenance
            ? updateMaintenanceLeagueSettings(leagueId, settings)
            : updateLeagueSettings(leagueId, settings),
        onSuccess: (updated) => {
            queryClient.setQueryData(queryKey, updated);
            queryClient.invalidateQueries({ queryKey: queryKeys.leagueStandings(leagueId) });
            onSuccess?.(updated);
        },
    });
}

export function useRemoveLeagueMember(leagueId, options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (manager) => removeLeagueMember(leagueId, manager.id),
        onSuccess: (updated, manager) => {
            queryClient.setQueryData(queryKeys.currentLeague(leagueId), updated);
            queryClient.setQueryData(queryKeys.leagueUsers(leagueId), (current = []) => (
                current.filter((item) => item.id !== manager.id)
            ));
            queryClient.invalidateQueries({ queryKey: queryKeys.leagueStandings(leagueId) });
            options.onSuccess?.(updated, manager);
        },
    });
}
