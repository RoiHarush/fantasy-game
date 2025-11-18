import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { fetchLeague } from "../../../services/leagueService";
import PageLayout from "../../PageLayout";
import PointsSummaryBlock from "../../Sidebar/PointsSummaryBlock";
import SidebarContainer from "../../Sidebar/SidebarContainer";
import LeagueTable from "./LeagueTable";
import LoadingPage from "../../General/LoadingPage";
import { useAuth } from "../../../Context/AuthContext";

function LeaguePage() {
    const { user } = useAuth();
    const { currentGameweek } = useGameweek();
    const [league, setLeague] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentGameweek) return;

        let cancelled = false;

        async function loadLeague() {
            setLoading(true);
            try {
                const data = await fetchLeague(currentGameweek.id);
                if (!cancelled) setLeague(data);
            } catch (err) {
                console.error("Failed to load league:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadLeague();

        return () => {
            cancelled = true;
        };
    }, [currentGameweek]);

    if (loading || !league) {
        return <LoadingPage />
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
