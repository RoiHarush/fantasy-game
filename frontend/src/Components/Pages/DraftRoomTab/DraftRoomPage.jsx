"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../Context/GameweeksContext";
import { useWebSocket } from "../../../Context/WebSocketContext";
import { useSquad } from "../../../features/squad/useSquad";
import { queryKeys } from "../../../lib/query/keys";
import { AdminService } from "../../../services/adminService";
import { fetchMyLeague } from "../../../services/leagueService";
import { fetchTransferWindowState } from "../../../services/transferWindowService";
import { fetchAllUsers } from "../../../services/usersService";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import TransferWindow from "../TransferWindowTab/TransferWindow";
import DraftLobby from "./DraftLobby";

function DraftRoomPage() {
    const { user, updateUser } = useAuth();
    const { nextGameweek } = useGameweek();
    const { subscribe, connected } = useWebSocket();
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const leagueId = user?.leagueId;

    const usersQuery = useQuery({
        queryKey: queryKeys.leagueUsers(leagueId),
        queryFn: fetchAllUsers,
        enabled: Boolean(leagueId),
        staleTime: 60_000,
    });
    const windowQuery = useQuery({
        queryKey: queryKeys.transferWindow(leagueId),
        queryFn: fetchTransferWindowState,
        enabled: Boolean(leagueId),
        refetchInterval: (query) => query.state.data?.isOpen ? false : 5_000,
    });
    const configQuery = useQuery({
        queryKey: queryKeys.draftConfig(leagueId),
        queryFn: () => AdminService.getDraftConfig().catch(() => null),
        enabled: Boolean(leagueId),
        refetchInterval: (query) => query.state.data?.processed ? false : 5_000,
    });
    const leagueQuery = useQuery({
        queryKey: queryKeys.currentLeague(leagueId),
        queryFn: fetchMyLeague,
        enabled: Boolean(leagueId),
        refetchInterval: (query) => query.state.data?.status === "ACTIVE" ? false : 5_000,
    });

    const windowState = windowQuery.data;
    const selectedSquadQuery = useSquad(selectedUserId, nextGameweek?.id, {
        enabled: Boolean(windowState?.isOpen && windowState?.isDraftMode),
    });
    const isAdmin = Boolean(user?.leagueAdmin);

    const refreshLobby = useCallback(async () => {
        await Promise.all([
            usersQuery.refetch(),
            windowQuery.refetch(),
            configQuery.refetch(),
            leagueQuery.refetch(),
        ]);
    }, [configQuery, leagueQuery, usersQuery, windowQuery]);

    useEffect(() => {
        if (!connected || !leagueId) return;

        const handleDraftEvent = (event) => {
            const windowKey = queryKeys.transferWindow(leagueId);
            const currentWindow = queryClient.getQueryData(windowKey);

            if (event.event === "window_opened") {
                queryClient.setQueryData(windowKey, (current = {}) => ({
                    ...current,
                    isOpen: true,
                    isDraftMode: true,
                    currentUserId: event.userId,
                    order: event.turnOrder,
                    initialOrder: event.initialOrder,
                    turnsUsed: event.turnsUsed,
                    totalTurns: event.totalTurns,
                }));
            }
            if (event.event === "window_closed" && currentWindow?.isDraftMode) {
                queryClient.setQueryData(windowKey, { isOpen: false, isDraftMode: false });
                queryClient.setQueryData(queryKeys.currentLeague(leagueId), (current) => (
                    current ? { ...current, status: "ACTIVE", leagueCode: null } : current
                ));
                queryClient.setQueryData(queryKeys.draftConfig(leagueId), (current) => (
                    current ? { ...current, processed: true } : current
                ));
                updateUser({ leagueStatus: "ACTIVE" });
            }
            if (event.event === "transfer_done" && currentWindow?.isDraftMode) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.squad(selectedUserId, nextGameweek?.id),
                });
            }
        };

        return subscribe(`/topic/leagues/${leagueId}/transfers`, handleDraftEvent);
    }, [connected, leagueId, nextGameweek?.id, queryClient, selectedUserId, subscribe, updateUser]);

    const loading = usersQuery.isPending
        || windowQuery.isPending
        || configQuery.isPending
        || leagueQuery.isPending;
    if (loading || !windowState) return <LoadingPage />;

    const error = usersQuery.error ?? windowQuery.error ?? configQuery.error ?? leagueQuery.error;
    if (error) return <div>Error loading draft room: {error.message}</div>;

    return windowState.isOpen && windowState.isDraftMode ? (
        <PageLayout
            left={
                <TransferWindow
                    user={user}
                    allUsers={usersQuery.data ?? []}
                    initialWindowState={windowState}
                />
            }
            right={
                <TransferUserSidebar
                    users={usersQuery.data ?? []}
                    currentUserId={selectedUserId}
                    onUserChange={setSelectedUserId}
                    squad={selectedSquadQuery.data ?? null}
                />
            }
        />
    ) : (
        <DraftLobby
            isAdmin={isAdmin}
            config={configQuery.data}
            league={leagueQuery.data}
            onRefresh={refreshLobby}
        />
    );
}

export default DraftRoomPage;
