"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { AdminService } from "../../services/adminService";
import { usePlayers } from "../players/usePlayers";

function updateStatList(current, updatedPlayer, valueField) {
    const isUpdatedPlayer = (player) => String(player.playerId) === String(updatedPlayer.playerId);
    const exists = current.some(isUpdatedPlayer);
    if (updatedPlayer[valueField] === 0) {
        return current.filter((player) => !isUpdatedPlayer(player));
    }
    return exists
        ? current.map((player) => isUpdatedPlayer(player) ? updatedPlayer : player)
        : [...current, updatedPlayer];
}

export function useAdminAssists(leagueId, gameweek) {
    const queryKey = queryKeys.adminAssists(leagueId, gameweek);
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey,
        queryFn: ({ signal }) => AdminService.getAssisters(gameweek, leagueId, { signal }),
        enabled: Boolean(gameweek),
    });
    const mutation = useMutation({
        mutationFn: ({ playerId, action }) => AdminService.updateAssist(playerId, gameweek, action, leagueId),
        onSuccess: (updatedPlayer) => {
            queryClient.setQueryData(queryKey, (current = []) => (
                updateStatList(current, updatedPlayer, "numOfAssist")
            ));
            queryClient.invalidateQueries({ queryKey: ["player-match"] });
        },
    });

    return { query, mutation };
}

export function useAdminPenalties(leagueId, gameweek) {
    const queryKey = queryKeys.adminPenalties(leagueId, gameweek);
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey,
        queryFn: ({ signal }) => AdminService.getPenaltiesConceded(gameweek, leagueId, { signal }),
        enabled: Boolean(gameweek),
    });
    const mutation = useMutation({
        mutationFn: ({ playerId, action }) => AdminService.updatePenaltyConceded(playerId, gameweek, action, leagueId),
        onSuccess: (updatedPlayer) => {
            queryClient.setQueryData(queryKey, (current = []) => (
                updateStatList(current, updatedPlayer, "penaltiesConceded")
            ));
            queryClient.invalidateQueries({ queryKey: ["player-match"] });
        },
    });

    return { query, mutation };
}

export function useLockedPlayers(leagueId) {
    const queryKey = queryKeys.lockedPlayers(leagueId);
    const queryClient = useQueryClient();
    const { setPlayers } = usePlayers();
    const query = useQuery({
        queryKey,
        queryFn: ({ signal }) => AdminService.getLockedPlayers(leagueId, { signal }),
    });
    const mutation = useMutation({
        mutationFn: ({ player, shouldLock }) => AdminService.togglePlayerLock(player.id, shouldLock, leagueId),
        onSuccess: (updatedPlayer, { shouldLock }) => {
            queryClient.setQueryData(queryKey, (current = []) => (
                shouldLock
                    ? [...current.filter((player) => String(player.id) !== String(updatedPlayer.id)), updatedPlayer]
                    : current.filter((player) => String(player.id) !== String(updatedPlayer.id))
            ));
            setPlayers((current) => current.map((player) => (
                String(player.id) === String(updatedPlayer.id) ? updatedPlayer : player
            )));
        },
    });

    return { query, mutation };
}

export function useUpdatePlayerPosition(leagueId) {
    const { setPlayers } = usePlayers();

    return useMutation({
        mutationFn: ({ playerId, positionId }) => AdminService.updatePlayerPosition(playerId, positionId, leagueId),
        onSuccess: (_result, { playerId, positionCode }) => {
            setPlayers((current) => current.map((player) => (
                String(player.id) === String(playerId) ? { ...player, position: positionCode } : player
            )));
        },
    });
}
