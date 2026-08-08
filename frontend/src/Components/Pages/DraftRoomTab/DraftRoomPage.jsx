"use client";

import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useDraftConfig } from "../../../features/draft/useDraft";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useCurrentLeague, useLeagueUsers } from "../../../features/league/useLeague";
import { useSquad } from "../../../features/squad/useSquad";
import { useTransferWindowState } from "../../../features/transfer-window/useTransferWindow";
import { useTransferScreenData } from "../../../features/transfer-window/useTransferScreenData";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import TransferWindow from "../TransferWindowTab/TransferWindow";
import DraftLobby from "./DraftLobby";

function DraftRoomPage() {
    const { user } = useAuth();
    const gameweekState = useGameweek();
    const { nextGameweek } = gameweekState;
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
    const isActiveDraft = Boolean(windowState?.isOpen && windowState?.isDraftMode);
    const screenData = useTransferScreenData(isActiveDraft);
    const selectedSquadQuery = useSquad(selectedUserId, nextGameweek?.id, {
        enabled: isActiveDraft,
    });
    const isAdmin = Boolean(user?.leagueAdmin);

    const loading = usersQuery.isPending
        || windowQuery.isPending
        || configQuery.isPending
        || leagueQuery.isPending
        || screenData.isPending
        || gameweekState.loading;

    const error = usersQuery.error
        ?? windowQuery.error
        ?? configQuery.error
        ?? leagueQuery.error
        ?? screenData.error
        ?? (gameweekState.error ? new Error(gameweekState.error) : null);
    if (error) return <div role="alert">Error loading draft room: {error.message}</div>;
    if (loading) return <LoadingPage />;
    if (!windowState) return <div role="alert">Draft state is temporarily unavailable.</div>;

    return windowState.isOpen && windowState.isDraftMode ? (
        <PageLayout
            left={
                <TransferWindow
                    user={user}
                    allUsers={usersQuery.data ?? []}
                    windowState={windowState}
                    nextGameweek={nextGameweek}
                    players={screenData.players}
                    teams={screenData.teams}
                    fixturesByTeam={screenData.fixturesByTeam}
                />
            }
            right={
                <TransferUserSidebar
                    users={usersQuery.data ?? []}
                    currentUserId={selectedUserId}
                    onUserChange={setSelectedUserId}
                    squad={selectedSquadQuery.data ?? null}
                    players={screenData.players}
                    fixturesByTeam={screenData.fixturesByTeam}
                    nextGameweek={nextGameweek}
                    isLoading={selectedSquadQuery.isPending}
                    error={selectedSquadQuery.error}
                />
            }
        />
    ) : (
        <DraftLobby
            isAdmin={isAdmin}
            config={configQuery.data}
            league={leagueQuery.data}
            users={usersQuery.data ?? []}
            onDraftTimeElapsed={() => {
                void Promise.all([
                    windowQuery.refetch(),
                    configQuery.refetch(),
                    leagueQuery.refetch(),
                ]);
            }}
        />
    );
}

export default DraftRoomPage;
