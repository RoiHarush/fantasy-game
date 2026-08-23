"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useWebSocket } from "../../Context/WebSocketContext";
import {
    getObservedAttendance,
    getObservedDraft,
    getObservedHistory,
    getObservedLeague,
    getObservedOrder,
    getObservedPlayers,
    getObservedPlayersOfTheWeek,
    getObservedPoints,
    getObservedSquad,
    getObservedSquadData,
    getObservedWindow,
} from "./observerApi";

export function useLeagueObserver({ leagueId, managerId, gameweekId, includePlayersOfTheWeek = false }) {
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
    const draft = useQuery({
        queryKey: ["admin", "observe", "draft", leagueId],
        queryFn: () => getObservedDraft(leagueId),
        enabled: Boolean(leagueId),
        refetchInterval: (query) => query.state.data?.processed ? false : 10_000,
        retry: false,
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
    const playersOfTheWeek = useQuery({
        queryKey: ["admin", "observe", "players-of-the-week", leagueId, effectiveManagerId, gameweekId],
        queryFn: () => getObservedPlayersOfTheWeek(leagueId, effectiveManagerId, gameweekId),
        enabled: Boolean(includePlayersOfTheWeek && leagueId && effectiveManagerId && gameweekId),
        staleTime: 5 * 60_000,
    });
    const historyGameweek = windowState.data?.gameWeekId > 0 ? windowState.data.gameWeekId : gameweekId || 1;
    const history = useQuery({
        queryKey: ["admin", "observe", "history", leagueId, historyGameweek],
        queryFn: () => getObservedHistory(leagueId, historyGameweek),
        enabled: Boolean(leagueId),
        refetchInterval: windowState.data?.isOpen ? 10_000 : false,
    });
    const order = useQuery({
        queryKey: ["admin", "observe", "order", leagueId, gameweekId],
        queryFn: () => getObservedOrder(leagueId, gameweekId),
        enabled: Boolean(leagueId && gameweekId),
        refetchInterval: windowState.data?.isOpen ? 3_000 : 30_000,
    });
    const attendance = useQuery({
        queryKey: ["admin", "observe", "attendance", leagueId, effectiveManagerId, gameweekId],
        queryFn: () => getObservedAttendance(leagueId, effectiveManagerId, gameweekId),
        enabled: Boolean(leagueId && effectiveManagerId && gameweekId),
        refetchInterval: windowState.data?.isOpen ? 3_000 : 30_000,
    });

    useEffect(() => {
        if (!leagueId) return undefined;
        return subscribe(`/topic/leagues/${leagueId}/transfers`, () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "observe"] });
        });
    }, [leagueId, queryClient, subscribe]);

    return {
        league,
        windowState,
        draft,
        squad,
        players,
        squadData,
        points,
        playersOfTheWeek,
        history,
        order,
        attendance,
        effectiveManagerId,
    };
}

export function useObservedManagerSquad({ leagueId, managerId, gameweekId, enabled = true }) {
    return useQuery({
        queryKey: ["admin", "observe", "sidebar-squad", leagueId, managerId, gameweekId],
        queryFn: () => getObservedSquad(leagueId, managerId, gameweekId),
        enabled: Boolean(enabled && leagueId && managerId && gameweekId),
        refetchInterval: 10_000,
    });
}
