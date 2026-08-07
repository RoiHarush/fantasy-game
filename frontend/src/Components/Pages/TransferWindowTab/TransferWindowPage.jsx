"use client";

import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useLeagueUsers } from "../../../features/league/useLeague";
import { useSquad } from "../../../features/squad/useSquad";
import { useTransferWindowState } from "../../../features/transfer-window/useTransferWindow";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import ClosedWindow from "./ClosedWindow";
import TransferWindow from "./TransferWindow";

function TransferWindowPage() {
    const { user } = useAuth();
    const { nextGameweek } = useGameweek();
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const usersQuery = useLeagueUsers(user?.leagueId);
    const windowQuery = useTransferWindowState(user?.leagueId);
    const selectedSquadQuery = useSquad(selectedUserId, nextGameweek?.id, {
        enabled: Boolean(windowQuery.data?.isOpen && !windowQuery.data?.isDraftMode),
    });

    if (usersQuery.isPending || windowQuery.isPending) return <LoadingPage />;

    const error = usersQuery.error ?? windowQuery.error;
    if (error) return <div>Error loading transfer window: {error.message}</div>;

    const users = usersQuery.data ?? [];
    const windowState = windowQuery.data;

    if (!windowState?.isOpen || windowState.isDraftMode) return <ClosedWindow />;

    return (
        <PageLayout
            left={
                <TransferWindow
                    user={user}
                    allUsers={users}
                />
            }
            right={
                <TransferUserSidebar
                    users={users}
                    currentUserId={selectedUserId}
                    onUserChange={setSelectedUserId}
                    squad={selectedSquadQuery.data ?? null}
                />
            }
        />
    );
}

export default TransferWindowPage;
