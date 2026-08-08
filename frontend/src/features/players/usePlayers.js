"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { useAuth } from "../../Context/AuthContext";
import { queryKeys } from "../../lib/query/keys";
import { getPlayers } from "./api";

export function usePlayers(options = {}) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = useMemo(
        () => queryKeys.players(user?.leagueId),
        [user?.leagueId],
    );
    const query = useQuery({
        queryKey,
        queryFn: ({ signal }) => getPlayers({ signal }),
        enabled: Boolean(user?.id && (options.enabled ?? true)),
        staleTime: 60_000,
    });
    const setPlayers = useCallback((updater) => {
        queryClient.setQueryData(queryKey, (current = []) => (
            typeof updater === "function" ? updater(current) : updater
        ));
    }, [queryClient, queryKey]);

    return { players: query.data ?? [], setPlayers, ...query };
}
