import { useEffect, useState } from "react";
import { fetchLeague } from "../../../services/leagueService";
import PageLayout from "../../PageLayout";
import PointsSummaryBlock from "../../Sidebar/PointsSummaryBlock";
import SidebarContainer from "../../Sidebar/SidebarContainer";
import LeagueTable from "./LeagueTable";
import LoadingPage from "../../General/LoadingPage";
import { useAuth } from "../../../Context/AuthContext";

function LeaguePage() {
    const { user } = useAuth();
    const [league, setLeague] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadLeague() {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchLeague();
                if (!cancelled) setLeague(data);
            } catch (err) {
                console.error("Failed to load league:", err);
                if (!cancelled) setError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadLeague();

        return () => {
            cancelled = true;
        };
    }, [user?.leagueId]);

    if (loading) {
        return <LoadingPage />
    }

    if (error) {
        return <div role="alert">Failed to load league: {error}</div>;
    }

    if (!league) {
        return <div role="status">League data is not available.</div>;
    }

    return (
        <PageLayout
            left={<LeagueTable currentUser={user} league={league} />}
            right={
                <SidebarContainer>
                    <PointsSummaryBlock user={user} />
                </SidebarContainer>
            }
        />
    );
}

export default LeaguePage;
