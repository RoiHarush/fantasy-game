"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "../../lib/query/keys";
import { fetchUserLivePoints, fetchUserPoints } from "../../services/pointsService";
import { fetchPlayerDataForGameweek, fetchSquadForGameweek } from "../../services/squadService";

export function usePointsPageData({ userId, gameweekId, live, enabled }) {
    return useQuery({
        queryKey: queryKeys.pointsPage(userId, gameweekId, live),
        queryFn: async () => {
            const pointsRequest = live
                ? fetchUserLivePoints(userId, gameweekId)
                : fetchUserPoints(userId, gameweekId);
            const [squad, points, playerData] = await Promise.all([
                fetchSquadForGameweek(userId, gameweekId),
                pointsRequest,
                fetchPlayerDataForGameweek(userId, gameweekId),
            ]);
            return { squad, points, playerData };
        },
        enabled: Boolean(enabled && userId && gameweekId),
        staleTime: live ? 10_000 : 5 * 60_000,
    });
}
