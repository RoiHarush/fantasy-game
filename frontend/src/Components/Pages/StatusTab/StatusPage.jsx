import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchLeague } from "../../../services/leagueService";
import PageLayout from "../../PageLayout";
import StatusSidebar from "../../Sidebar/StatusSidebar";
import Status from "./Status";
import LoadingPage from "../../General/LoadingPage";
import { useAuth } from "../../../Context/AuthContext";

function StatusPage() {
    const { user } = useAuth();
    const { currentGameweek, nextGameweek } = useGameweek();

    const [league, setLeague] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!currentGameweek) return;

        let cancelled = false;

        async function load() {
            try {
                const leagueData = await fetchLeague(currentGameweek.id);
                if (!cancelled) {
                    setLeague(leagueData);
                }
            } catch (err) {
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => (cancelled = true);
    }, [currentGameweek]);

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
