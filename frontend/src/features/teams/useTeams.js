"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../Context/AuthContext";
import { queryKeys } from "../../lib/query/keys";
import { getTeams } from "./api";

export function useTeams() {
    const { user } = useAuth();
    const query = useQuery({
        queryKey: queryKeys.teams,
        queryFn: ({ signal }) => getTeams({ signal }),
        enabled: Boolean(user?.id),
        staleTime: 5 * 60_000,
    });

    return { teams: query.data ?? [], ...query };
}
