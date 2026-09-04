"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "../../Context/AuthContext";
import { useWebSocket } from "../../Context/WebSocketContext";
import { queryKeys } from "../../lib/query/keys";

export default function RealtimeTradeSync() {
    const { user } = useAuth();
    const { connected, subscribe } = useWebSocket();
    const queryClient = useQueryClient();
    const leagueId = user?.leagueId;

    useEffect(() => {
        if (!connected || !leagueId) return undefined;
        return subscribe(`/topic/leagues/${leagueId}/trades`, () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.trades(leagueId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.tradeContext(leagueId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.players(leagueId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.leagueStandings(leagueId) });
            queryClient.invalidateQueries({ queryKey: ["squad"] });
        });
    }, [connected, leagueId, queryClient, subscribe]);

    return null;
}
