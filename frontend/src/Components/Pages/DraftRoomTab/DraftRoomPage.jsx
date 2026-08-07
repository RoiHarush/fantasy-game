"use client";

import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useDraftConfig } from "../../../features/draft/useDraft";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useCurrentLeague, useLeagueUsers } from "../../../features/league/useLeague";
import { useSquad } from "../../../features/squad/useSquad";
import { useTransferWindowState } from "../../../features/transfer-window/useTransferWindow";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import TransferWindow from "../TransferWindowTab/TransferWindow";
import DraftLobby from "./DraftLobby";

function DraftRoomPage() {
    const { user } = useAuth();
    const { nextGameweek } = useGameweek();
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const leagueId = user?.leagueId;

    const usersQuery = useLeagueUsers(leagueId);
    const windowQuery = useTransferWindowState(leagueId, {
        refetchInterval: (query) => query.state.data?.isOpen ? false : 5_000,
    });
    const configQuery = useDraftConfig(leagueId, {
        refetchInterval: (query) => query.state.data?.processed ? false : 5_000,
        retry: false,
    });
    const leagueQuery = useCurrentLeague(leagueId, {
        refetchInterval: (query) => query.state.data?.status === "ACTIVE" ? false : 5_000,
    });

    const windowState = windowQuery.data;
    const selectedSquadQuery = useSquad(selectedUserId, nextGameweek?.id, {
        enabled: Boolean(windowState?.isOpen && windowState?.isDraftMode),
    });
    const isAdmin = Boolean(user?.leagueAdmin);

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
        />
    );
}

export default DraftRoomPage;
