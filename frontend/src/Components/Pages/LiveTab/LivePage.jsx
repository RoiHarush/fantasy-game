"use client";

import { useLeagueLive } from "../../../features/live/useLeagueLive";
import { useTeams } from "../../../features/teams/useTeams";
import LoadingPage from "../../General/LoadingPage";
import LeagueLiveBoard from "./LeagueLiveBoard";

export default function LivePage() {
    const live = useLeagueLive();
    const teams = useTeams();

    if (live.isPending || teams.isPending) {
        return <LoadingPage title="Opening the live match centre" description="Finding every owned player involved in the matches happening now." />;
    }
    if (live.error || teams.error) {
        return (
            <p role="alert" className="mx-auto my-8 max-w-3xl rounded-xl border border-app-danger-border bg-app-danger-surface p-4 text-app-danger-foreground">
                Live match data is temporarily unavailable. Please try again shortly.
            </p>
        );
    }

    return <LeagueLiveBoard data={live.data} teams={teams.teams} />;
}
