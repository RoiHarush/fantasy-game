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
    const { currentGameweek, nextGameweek } = useGameweek();

    const [league, setLeague] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                if (leagueDetails.status === "ACTIVE" && currentGameweek) {
                    const leagueData = await fetchLeague(currentGameweek.id);
                    if (!cancelled) setLeague(leagueData);
                } else if (!cancelled) {
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

    if (loading || !currentGameweek || !nextGameweek) {
        return <LoadingPage />;
    }

    if (error) {
        return <div>Error loading status: {error}</div>;
    }

    return (
        <PageLayout
            left={
                <Status
                    user={user}
                    league={league}
                    currentGameweek={currentGameweek}
                    nextGameweek={nextGameweek}
                />
            }
            right={<StatusSidebar league={league} user={user} />}
        />
    );
}

export default StatusPage;
