"use client";

import { useAuth } from "../../../Context/AuthContext";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import {
    useCurrentLeague,
    useLeagueStandings,
} from "../../../features/league/useLeague";
import LoadingPage from "../../General/LoadingPage";
import PageLayout from "../../PageLayout";
import StatusSidebar from "../../Sidebar/StatusSidebar";
import PreDraftStatus from "./PreDraftStatus";
import Status from "./Status";

function StatusPage() {
    const { user } = useAuth();
    const { currentGameweek, nextGameweek, lastGameweek } = useGameweek();
    const leagueDetailsQuery = useCurrentLeague(user?.leagueId, {
        refetchInterval: (query) => query.state.data?.status === "ACTIVE" ? false : 5_000,
    });
    const leagueIsActive = leagueDetailsQuery.data?.status === "ACTIVE";
    const standingsQuery = useLeagueStandings(user?.leagueId, {
        enabled: leagueIsActive,
    });
    const isPreSeason = !lastGameweek && !currentGameweek && nextGameweek?.status === "UPCOMING";

    const error = leagueDetailsQuery.error ?? standingsQuery.error;
    if (error) return <div>Error loading status: {error.message}</div>;

    if (!leagueDetailsQuery.isPending && leagueDetailsQuery.data?.status !== "ACTIVE") {
        return <PreDraftStatus league={leagueDetailsQuery.data} />;
    }

    const loading = leagueDetailsQuery.isPending
        || (leagueIsActive && standingsQuery.isPending)
        || !nextGameweek
        || (!currentGameweek && !isPreSeason);
    if (loading) return <LoadingPage />;

    const league = standingsQuery.data ?? leagueDetailsQuery.data;
    const displayedGameweek = currentGameweek ?? nextGameweek;

    return (
        <PageLayout
            left={
                <Status
                    user={user}
                    league={league}
                    currentGameweek={displayedGameweek}
                    nextGameweek={nextGameweek}
                    preSeason={isPreSeason}
                />
            }
            right={<StatusSidebar league={league} user={user} preSeason={isPreSeason} />}
        />
    );
}

export default StatusPage;
