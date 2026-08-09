"use client";

import { useState } from "react";
import Link from "next/link";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useAuth } from "../../../Context/AuthContext";
import { useSquad } from "../../../features/squad/useSquad";
import { useWaiverPlan } from "../../../features/waivers/useWaiverPlan";
import { usePlayers } from "../../../features/players/usePlayers";
import { useTeams } from "../../../features/teams/useTeams";
import { useAllTeamFixtures } from "../../../features/fixtures/useAllTeamFixtures";
import PageLayout from "../../PageLayout";
import UserSquadSidebar from "../../Sidebar/UserSquadSidebar";
import Scout from "./Scout";
import LoadingPage from "../../General/LoadingPage";

function ScoutPage() {
    const { user } = useAuth();
    const { nextGameweek, loading: gameweeksLoading, error: gameweeksError } = useGameweek();

    const [waiverMessage, setWaiverMessage] = useState("");
    const hasUpcomingSquad = Boolean(user?.leagueId && nextGameweek?.id);
    const waiversEnabled = hasUpcomingSquad && user?.leagueStatus === "ACTIVE";
    const squadQuery = useSquad(user?.id, nextGameweek?.id, { enabled: hasUpcomingSquad });
    const waiverPlan = useWaiverPlan(waiversEnabled ? nextGameweek?.id : null);
    const playersQuery = usePlayers();
    const teamsQuery = useTeams();
    const fixturesQuery = useAllTeamFixtures(teamsQuery.teams);

    async function updateWaiverEntries(nextEntries) {
        if (!nextGameweek?.id) return;
        setWaiverMessage("");
        try {
            await waiverPlan.saveEntries(nextEntries);
            setWaiverMessage(`Waiver priorities saved for Gameweek ${nextGameweek.id}.`);
        } catch (saveError) {
            setWaiverMessage(saveError.message);
        }
    }

    const loading = gameweeksLoading
        || playersQuery.isPending
        || teamsQuery.isPending
        || fixturesQuery.isPending
        || (hasUpcomingSquad && squadQuery.isPending)
        || (waiversEnabled && waiverPlan.loading);
    const error = gameweeksError
        || squadQuery.error?.message
        || waiverPlan.loadError?.message
        || playersQuery.error?.message
        || teamsQuery.error?.message
        || fixturesQuery.error?.message;

    if (loading) return <LoadingPage />;

    if (error) return <p role="alert">Error loading squad: {error}</p>;

    const sidebar = !user.leagueId ? (
        <aside className="rounded-2xl border border-app-border bg-app-surface p-5 text-app-foreground shadow-panel">
            <h2 className="text-lg font-extrabold">Ready to draft?</h2>
            <p className="mt-2 text-sm text-app-muted">Create or join a league to see your squad alongside the scout.</p>
            <Link className="mt-4 inline-flex rounded-control bg-component-gradient px-4 py-2 text-sm font-extrabold text-brand-ink" href="/onboarding">Create or join a league</Link>
        </aside>
    ) : nextGameweek ? (
        <UserSquadSidebar
            user={user}
            squad={squadQuery.data}
            players={playersQuery.players}
            fixturesByTeam={fixturesQuery.fixturesByTeam ?? {}}
            nextGameweek={nextGameweek}
        />
    ) : (
        <aside className="rounded-2xl border border-app-border bg-app-surface p-5 text-app-foreground shadow-panel">
            <h2 className="text-lg font-extrabold">No upcoming gameweek</h2>
            <p className="mt-2 text-sm text-app-muted">{gameweeksError || "Squad data will appear when an upcoming gameweek is available."}</p>
        </aside>
    );

    return (
        <PageLayout
            left={
                <Scout
                    user={user}
                    players={playersQuery.players}
                    teams={teamsQuery.teams}
                    fixturesByTeam={fixturesQuery.fixturesByTeam ?? {}}
                    squad={squadQuery.data ?? null}
                    waiverEntries={waiverPlan.entries}
                    onWaiverEntriesChange={waiversEnabled ? updateWaiverEntries : undefined}
                    waiverSaving={waiverPlan.saving}
                    waiverMessage={waiverMessage}
                    waiverGameweekId={nextGameweek?.id}
                />
            }
            right={sidebar}
        />
    );
}

export default ScoutPage;
