import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchLeague, fetchMyLeague } from "../../../services/leagueService";
import PageLayout from "../../PageLayout";
import StatusSidebar from "../../Sidebar/StatusSidebar";
import Status from "./Status";
import LoadingPage from "../../General/LoadingPage";
import { useAuth } from "../../../Context/AuthContext";
import PreDraftStatus from "./PreDraftStatus";

function StatusPage() {
    const { user, updateUser } = useAuth();
    const { currentGameweek, nextGameweek, lastGameweek } = useGameweek();

    const [league, setLeague] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isPreSeason = !lastGameweek && !currentGameweek && nextGameweek?.status === "UPCOMING";

    useEffect(() => {
        let cancelled = false;
        let retryTimer;

        async function load() {
            try {
                const leagueDetails = await fetchMyLeague();
                if (!cancelled) {
                    setLeague(leagueDetails);
                    updateUser({ leagueStatus: leagueDetails.status });
                }
                if (leagueDetails.status === "ACTIVE") {
                    const leagueData = await fetchLeague();
                    if (!cancelled) setLeague(leagueData);
                } else if (leagueDetails.status !== "ACTIVE" && !cancelled) {
                    retryTimer = window.setTimeout(load, 5000);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
            window.clearTimeout(retryTimer);
        };
    }, [currentGameweek, updateUser]);

    if (!loading && league?.status && league.status !== "ACTIVE") {
        return <PreDraftStatus league={league} />;
    }

    if (loading || !nextGameweek || (!currentGameweek && !isPreSeason)) {
        return <LoadingPage />;
    }

    if (error) {
        return <div>Error loading status: {error}</div>;
    }

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
