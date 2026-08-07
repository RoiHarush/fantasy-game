"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import {
    assignIrPlayer,
    releaseIrPlayer,
    saveTeamRequest,
    toggleFirstPickCaptain,
} from "../../services/pickTeamService";
import { buildSaveTeamDto } from "./model";

function cacheChipResult(queryClient, userId, gameweekId, result) {
    queryClient.setQueryData(queryKeys.squad(userId, gameweekId), result.updatedSquad);
    queryClient.setQueryData(queryKeys.userChips(userId), result.updatedChips);
}

export function useSaveTeam(userId, gameweekId, onSuccess) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (squad) => saveTeamRequest(userId, buildSaveTeamDto(squad)),
        onSuccess: (updatedSquad) => {
            queryClient.setQueryData(queryKeys.squad(userId, gameweekId), updatedSquad);
            onSuccess?.(updatedSquad);
        },
    });
}

export function useIrChip({ userId, gameweekId, onSuccess, onError, onSettled }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ mode, playerId }) => mode === "assign"
            ? assignIrPlayer(userId, playerId)
            : releaseIrPlayer(userId, playerId),
        onSuccess: (result, variables) => {
            cacheChipResult(queryClient, userId, gameweekId, result);
            queryClient.invalidateQueries({ queryKey: queryKeys.squadPlayerData(userId, gameweekId) });
            onSuccess?.(result, variables);
        },
        onError,
        onSettled,
    });
}

export function useFirstPickCaptain({ userId, gameweekId, active, onSuccess, onError, onSettled }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => toggleFirstPickCaptain(userId, active),
        onSuccess: (result) => {
            cacheChipResult(queryClient, userId, gameweekId, result);
            onSuccess?.(result);
        },
        onError,
        onSettled,
    });
}
