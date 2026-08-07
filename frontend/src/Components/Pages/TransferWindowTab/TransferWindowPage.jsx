"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../Context/GameweeksContext";
import { useSquad } from "../../../features/squad/useSquad";
import { queryKeys } from "../../../lib/query/keys";
import { fetchTransferWindowState } from "../../../services/transferWindowService";
import { fetchAllUsers } from "../../../services/usersService";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import ClosedWindow from "./ClosedWindow";
import TransferWindow from "./TransferWindow";

function TransferWindowPage() {
    const { user } = useAuth();
    const { nextGameweek } = useGameweek();
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const usersQuery = useQuery({
        queryKey: queryKeys.leagueUsers(user?.leagueId),
        queryFn: fetchAllUsers,
        enabled: Boolean(user?.leagueId),
        staleTime: 60_000,
    });
    const windowQuery = useQuery({
        queryKey: queryKeys.transferWindow(user?.leagueId),
        queryFn: fetchTransferWindowState,
        enabled: Boolean(user?.leagueId),
    });
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
                    initialWindowState={windowState}
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
