"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useWebSocket } from "../../Context/WebSocketContext";
import {
    getObservedHistory,
    getObservedLeague,
    getObservedPlayers,
    getObservedPoints,
    getObservedSquad,
    getObservedSquadData,
    getObservedWindow,
} from "./observerApi";

export function useLeagueObserver({ leagueId, managerId, gameweekId }) {
    const { subscribe } = useWebSocket();
    const queryClient = useQueryClient();
    const league = useQuery({
        queryKey: ["admin", "observe", "league", leagueId],
        queryFn: () => getObservedLeague(leagueId),
        enabled: Boolean(leagueId),
        refetchInterval: 30_000,
    });
    const windowState = useQuery({
        queryKey: ["admin", "observe", "window", leagueId],
        queryFn: () => getObservedWindow(leagueId),
        enabled: Boolean(leagueId),
        refetchInterval: (query) => query.state.data?.isOpen ? 3_000 : 10_000,
    });
    const effectiveManagerId = managerId || league.data?.managers?.[0]?.userId || "";
    const squadGameweekId = windowState.data?.isOpen && windowState.data?.gameWeekId > 0
        ? windowState.data.gameWeekId
        : gameweekId;
    const squad = useQuery({
        queryKey: ["admin", "observe", "squad", leagueId, effectiveManagerId, squadGameweekId],
        queryFn: () => getObservedSquad(leagueId, effectiveManagerId, squadGameweekId),
        enabled: Boolean(leagueId && effectiveManagerId),
        refetchInterval: 30_000,
    });
    const players = useQuery({
        queryKey: ["admin", "observe", "players", leagueId, effectiveManagerId],
        queryFn: () => getObservedPlayers(leagueId, effectiveManagerId),
        enabled: Boolean(leagueId && effectiveManagerId),
        refetchInterval: 60_000,
    });
    const squadData = useQuery({
        queryKey: ["admin", "observe", "squad-data", leagueId, effectiveManagerId, gameweekId],
        queryFn: () => getObservedSquadData(leagueId, effectiveManagerId, gameweekId),
        enabled: Boolean(leagueId && effectiveManagerId && gameweekId),
        refetchInterval: 60_000,
    });
    const points = useQuery({
        queryKey: ["admin", "observe", "points", leagueId, effectiveManagerId, gameweekId],
        queryFn: () => getObservedPoints(leagueId, effectiveManagerId, gameweekId),
        enabled: Boolean(leagueId && effectiveManagerId && gameweekId),
        refetchInterval: 60_000,
    });
    const historyGameweek = windowState.data?.gameWeekId > 0 ? windowState.data.gameWeekId : gameweekId || 1;
    const history = useQuery({
        queryKey: ["admin", "observe", "history", leagueId, historyGameweek],
        queryFn: () => getObservedHistory(leagueId, historyGameweek),
        enabled: Boolean(leagueId),
        refetchInterval: windowState.data?.isOpen ? 10_000 : false,
    });

    useEffect(() => {
        if (!leagueId) return undefined;
        return subscribe(`/topic/leagues/${leagueId}/transfers`, () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "observe"] });
        });
    }, [leagueId, queryClient, subscribe]);

    return { league, windowState, squad, players, squadData, points, history, effectiveManagerId };
}
