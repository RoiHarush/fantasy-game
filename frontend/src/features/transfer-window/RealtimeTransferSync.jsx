"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "../../Context/AuthContext";
import { useWebSocket } from "../../Context/WebSocketContext";
import { queryKeys } from "../../lib/query/keys";
import {
    applyTransferWindowEvent,
    updatePlayerOwnership,
    updateTransferNotice,
} from "./model";

export default function RealtimeTransferSync() {
    const { user, updateUser } = useAuth();
    const { connected, subscribe } = useWebSocket();
    const queryClient = useQueryClient();
    const leagueId = user?.leagueId;

    useEffect(() => {
        if (!connected || !leagueId) return;

        queryClient.invalidateQueries({ queryKey: queryKeys.transferWindow(leagueId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.players(leagueId) });

        return subscribe(`/topic/leagues/${leagueId}/transfers`, (event) => {
            const windowKey = queryKeys.transferWindow(leagueId);
            const previousWindow = queryClient.getQueryData(windowKey) ?? {};
            const wasDraftMode = Boolean(previousWindow.isDraftMode);
            const gameweekId = previousWindow.gameWeekId;

            queryClient.setQueryData(
                windowKey,
                applyTransferWindowEvent(previousWindow, event),
            );
            queryClient.setQueryData(
                queryKeys.transferEvent(leagueId),
                (previous) => updateTransferNotice(previous, event),
            );

            if (event.event === "window_opened") {
                queryClient.invalidateQueries({ queryKey: windowKey });
            }

            if (event.event === "transfer_done") {
                queryClient.setQueryData(
                    queryKeys.players(leagueId),
                    (players = []) => updatePlayerOwnership(players, event),
                );
                queryClient.invalidateQueries({
                    queryKey: ["squad", event.userId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["transfer-history", leagueId],
                });
            }

            if (event.event === "window_closed" && wasDraftMode) {
                queryClient.setQueryData(queryKeys.currentLeague(leagueId), (current) => (
                    current ? { ...current, status: "ACTIVE", leagueCode: null } : current
                ));
                queryClient.setQueryData(queryKeys.draftConfig(leagueId), (current) => (
                    current ? { ...current, processed: true } : current
                ));
                if (gameweekId) {
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.squad(user.id, gameweekId),
                    });
                }
                updateUser({ leagueStatus: "ACTIVE" });
            }
        });
    }, [connected, leagueId, queryClient, subscribe, updateUser, user?.id]);

    return null;
}
