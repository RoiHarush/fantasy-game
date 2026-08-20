"use client";

import { useState } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { getNextTransferGameweek } from "../../../features/gameweeks/model";
import { useLeagueUsers } from "../../../features/league/useLeague";
import { useSquad } from "../../../features/squad/useSquad";
import { useTransferWindowState } from "../../../features/transfer-window/useTransferWindow";
import { useTransferScreenData } from "../../../features/transfer-window/useTransferScreenData";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import TransferUserSidebar from "../../Sidebar/TransferUserSidebar";
import ClosedWindow from "./ClosedWindow";
import TransferWindow from "./TransferWindow";

function TransferWindowPage() {
    const { user } = useAuth();
    const gameweekState = useGameweek();
    const { gameweeks, currentGameweek, nextGameweek } = gameweekState;
    const [selectedUserId, setSelectedUserId] = useState(user?.id);
    const usersQuery = useLeagueUsers(user?.leagueId);
    const windowQuery = useTransferWindowState(user?.leagueId, { refetchInterval: 3_000 });
    const windowState = windowQuery.data;
    const isActiveTransferWindow = Boolean(windowState?.isOpen && !windowState?.isDraftMode);
    const scheduledTransferGameweek = getNextTransferGameweek({ gameweeks, nextGameweek });
    const transferGameweek = isActiveTransferWindow
        ? gameweeks.find(gameweek => Number(gameweek.id) === Number(windowState?.gameWeekId))
            ?? scheduledTransferGameweek
        : scheduledTransferGameweek;
    const screenData = useTransferScreenData(isActiveTransferWindow);
    const selectedSquadQuery = useSquad(selectedUserId, transferGameweek?.id, {
        enabled: isActiveTransferWindow,
    });

    if (usersQuery.isPending || windowQuery.isPending || gameweekState.loading) return <LoadingPage />;

    const error = usersQuery.error ?? windowQuery.error ?? (gameweekState.error ? new Error(gameweekState.error) : null);
    if (error) return <div>Error loading transfer window: {error.message}</div>;

    const users = usersQuery.data ?? [];
    if (!windowState?.isOpen || windowState.isDraftMode) {
        return (
            <ClosedWindow
                user={user}
                users={users}
                nextGameweek={transferGameweek}
                gameweeks={gameweeks}
                currentGameweek={currentGameweek}
            />
        );
    }

    if (screenData.isPending) return <LoadingPage />;
    if (screenData.error) return <div role="alert">Error loading transfer data: {screenData.error.message}</div>;

    return (
        <PageLayout
            left={
                <TransferWindow
                    user={user}
                    allUsers={users}
                    windowState={windowState}
                    nextGameweek={transferGameweek}
                    players={screenData.players}
                    teams={screenData.teams}
                    fixturesByTeam={screenData.fixturesByTeam}
                    isClosing={Boolean(windowState.isClosing)}
                />
            }
            right={
                <TransferUserSidebar
                    users={users}
                    currentUserId={selectedUserId}
                    onUserChange={setSelectedUserId}
                    squad={selectedSquadQuery.data ?? null}
                    players={screenData.players}
                    fixturesByTeam={screenData.fixturesByTeam}
                    nextGameweek={transferGameweek}
                    isLoading={selectedSquadQuery.isPending}
                    error={selectedSquadQuery.error}
                />
            }
        />
    );
}

export default TransferWindowPage;
