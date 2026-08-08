"use client";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import {
    useCurrentLeague,
    useLeagueStandings,
} from "../../../features/league/useLeague";
import { deriveStatusGameweekView } from "../../../features/status/model";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import StatusSidebar from "../../Sidebar/StatusSidebar";
import PreDraftStatus from "./PreDraftStatus";
import Status from "./Status";

function StatusPage() {
    const { user } = useAuth();
    const gameweekState = useGameweek();
    const leagueDetailsQuery = useCurrentLeague(user?.leagueId, {
        refetchInterval: (query) => query.state.data?.status === "ACTIVE" ? false : 5_000,
    });
    const leagueIsActive = leagueDetailsQuery.data?.status === "ACTIVE";
    const standingsQuery = useLeagueStandings(user?.leagueId, {
        enabled: leagueIsActive,
    });
    const leagueError = leagueDetailsQuery.error ?? standingsQuery.error;
    if (leagueError) return <p role="alert">Error loading status: {leagueError.message}</p>;

    if (!leagueDetailsQuery.isPending && leagueDetailsQuery.data?.status !== "ACTIVE") {
        return <PreDraftStatus league={leagueDetailsQuery.data} />;
    }

    const loading = leagueDetailsQuery.isPending
        || (leagueIsActive && standingsQuery.isPending)
        || gameweekState.loading;
    if (loading) return <LoadingPage />;

    if (gameweekState.error) {
        return <p role="alert">Error loading the gameweek schedule: {gameweekState.error}</p>;
    }

    const gameweekView = deriveStatusGameweekView(gameweekState);
    if (!gameweekView.displayedGameweek) {
        return <p role="status">No gameweek schedule is currently available.</p>;
    }

    const league = standingsQuery.data ?? leagueDetailsQuery.data;

    return (
        <PageLayout
            left={
                <Status
                    user={user}
                    league={league}
                    currentGameweek={gameweekView.displayedGameweek}
                    nextGameweek={gameweekState.nextGameweek}
                    preSeason={gameweekView.preSeason}
                    seasonComplete={gameweekView.seasonComplete}
                    transferHistoryGameweekId={gameweekView.transferHistoryGameweekId}
                />
            }
            right={<StatusSidebar league={league} user={user} preSeason={gameweekView.preSeason} />}
        />
    );
}

export default StatusPage;
