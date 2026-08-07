"use client";

import { useLeagueStandings } from "../../../features/league/useLeague";
import PageLayout from "../../PageLayout";
import PointsSummaryBlock from "../../Sidebar/PointsSummaryBlock";
import SidebarContainer from "../../Sidebar/SidebarContainer";
import LeagueTable from "./LeagueTable";
import LoadingPage from "../../General/LoadingPage";
import { useAuth } from "../../../Context/AuthContext";

function LeaguePage() {
    const { user } = useAuth();
    const leagueQuery = useLeagueStandings(user?.leagueId);
    const league = leagueQuery.data;

    if (leagueQuery.isPending) {
        return <LoadingPage />
    }

    if (leagueQuery.error) {
        return <div role="alert">Failed to load league: {leagueQuery.error.message}</div>;
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
