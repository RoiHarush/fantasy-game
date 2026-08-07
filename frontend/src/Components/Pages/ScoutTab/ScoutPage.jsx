"use client";

import { useState } from "react";
import Link from "next/link";
import { useGameweek } from "../../../Context/GameweeksContext";
import { useAuth } from "../../../Context/AuthContext";
import { useSquad } from "../../../features/squad/useSquad";
import { useWaiverPlan } from "../../../features/waivers/useWaiverPlan";
import PageLayout from "../../PageLayout";
import UserSquadSidebar from "../../Sidebar/UserSquadSidebar";
import Scout from "./Scout";
import LoadingPage from "../../General/LoadingPage";

function ScoutPage() {
    const { user } = useAuth();
    const { nextGameweek, loading: gameweeksLoading, error: gameweeksError } = useGameweek();

    const [waiverMessage, setWaiverMessage] = useState("");
    const hasUpcomingSquad = Boolean(user?.leagueId && nextGameweek?.id);
    const squadQuery = useSquad(user?.id, nextGameweek?.id, { enabled: hasUpcomingSquad });
    const waiverPlan = useWaiverPlan(hasUpcomingSquad ? nextGameweek?.id : null);

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
        || (hasUpcomingSquad && (squadQuery.isPending || waiverPlan.loading));
    const error = gameweeksError || squadQuery.error?.message || waiverPlan.error?.message;

    if (loading) return <LoadingPage />;

    if (error) return <div>Error loading squad: {error}</div>;

    const sidebar = !user.leagueId ? (
        <aside>
            <h2>Ready to draft?</h2>
            <p>Create or join a league to see your squad alongside the scout.</p>
            <Link href="/onboarding">Create or join a league</Link>
        </aside>
    ) : nextGameweek ? (
        <UserSquadSidebar user={user} squad={squadQuery.data} />
    ) : (
        <aside>
            <h2>No upcoming gameweek</h2>
            <p>{gameweeksError || "Squad data will appear when an upcoming gameweek is available."}</p>
        </aside>
    );

    return (
        <PageLayout
            left={
                <Scout
                    user={user}
                    squad={squadQuery.data ?? null}
                    waiverEntries={waiverPlan.entries}
                    onWaiverEntriesChange={updateWaiverEntries}
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
