"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { fetchUserChips } from "../../services/pickTeamService";
import { fetchPlayerDataForGameweek } from "../../services/squadService";
import { useSquad } from "../squad/useSquad";

export function usePickTeamData(userId, gameweekId) {
    const squad = useSquad(userId, gameweekId);
    const chips = useQuery({
        queryKey: queryKeys.userChips(userId),
        queryFn: ({ signal }) => fetchUserChips(userId, { signal }),
        enabled: Boolean(userId),
        staleTime: 60_000,
    });
    const playerData = useQuery({
        queryKey: queryKeys.squadPlayerData(userId, gameweekId),
        queryFn: ({ signal }) => fetchPlayerDataForGameweek(userId, gameweekId, { signal }),
        enabled: Boolean(userId && gameweekId),
        staleTime: 30_000,
    });

    return {
        squad,
        chips,
        playerData,
        isPending: squad.isPending || chips.isPending || playerData.isPending,
        error: squad.error ?? chips.error ?? playerData.error ?? null,
    };
}
