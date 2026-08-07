"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { AdminService } from "../../services/adminService";

function executeDraftAction(action, leagueId, maintenance) {
    const scopedLeagueId = maintenance ? leagueId : null;

    switch (action.type) {
        case "schedule":
            return AdminService.scheduleDraft(action.time, scopedLeagueId);
        case "open":
            return AdminService.openDraftNow(scopedLeagueId);
        case "delete":
            return AdminService.deleteDraft(scopedLeagueId);
        default:
            throw new Error(`Unsupported draft action: ${action.type}`);
    }
}

export function useDraftConfig(leagueId, options = {}) {
    const maintenance = Boolean(options.maintenance);

    return useQuery({
        queryKey: queryKeys.draftConfig(leagueId),
        queryFn: () => AdminService.getDraftConfig(maintenance ? leagueId : null),
        enabled: Boolean(leagueId && (options.enabled ?? true)),
        refetchInterval: options.refetchInterval,
        retry: options.retry,
    });
}

export function useDraftAction(leagueId, options = {}) {
    const queryClient = useQueryClient();
    const maintenance = Boolean(options.maintenance);

    return useMutation({
        mutationFn: (action) => executeDraftAction(action, leagueId, maintenance),
        onSuccess: async (result, action) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.draftConfig(leagueId) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.currentLeague(leagueId) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceLeague(leagueId) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceLeagues }),
                queryClient.invalidateQueries({ queryKey: queryKeys.transferWindow(leagueId) }),
            ]);
            options.onSuccess?.(result, action);
        },
    });
}
