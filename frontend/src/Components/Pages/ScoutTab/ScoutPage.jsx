"use client";

import { useState } from "react";
import Link from "next/link";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { getNextTransferGameweek } from "../../../features/gameweeks/model";
import { useAuth } from "../../../Context/AuthContext";
import { useSquad } from "../../../features/squad/useSquad";
import { useIrWaiverPlan, useWaiverPlan } from "../../../features/waivers/useWaiverPlan";
import { usePlayers } from "../../../features/players/usePlayers";
import { useTeams } from "../../../features/teams/useTeams";
import { useAllTeamFixtures } from "../../../features/fixtures/useAllTeamFixtures";
import PageLayout from "../../PageLayout";
import UserSquadSidebar from "../../Sidebar/UserSquadSidebar";
import Scout from "./Scout";
import LoadingPage from "../../General/LoadingPage";

function ScoutPage() {
    const { user } = useAuth();
    const { gameweeks, nextGameweek, loading: gameweeksLoading, error: gameweeksError } = useGameweek();
    const transferGameweek = getNextTransferGameweek({ gameweeks, nextGameweek });

    const [waiverEditState, setWaiverEditState] = useState({
        gameweekId: null,
        dirty: false,
        message: "",
    });
    const [irWaiverEditState, setIrWaiverEditState] = useState({
        gameweekId: null,
        dirty: false,
        message: "",
    });
    const hasUpcomingSquad = Boolean(user?.leagueId && nextGameweek?.id);
    const waiversEnabled = Boolean(hasUpcomingSquad && transferGameweek?.id && user?.leagueStatus === "ACTIVE");
    const squadQuery = useSquad(user?.id, nextGameweek?.id, { enabled: hasUpcomingSquad });
    const waiverPlan = useWaiverPlan(waiversEnabled ? transferGameweek?.id : null);
    const hasActiveIrPlayer = Boolean(squadQuery.data?.irId);
    const irWaiverPlan = useIrWaiverPlan(
        waiversEnabled && hasActiveIrPlayer ? transferGameweek?.id : null,
    );
    const playersQuery = usePlayers();
    const teamsQuery = useTeams();
    const fixturesQuery = useAllTeamFixtures(teamsQuery.teams);

    const waiverDirty = waiverEditState.gameweekId === transferGameweek?.id
        && waiverEditState.dirty;
    const waiverMessage = waiverEditState.gameweekId === transferGameweek?.id
        ? waiverEditState.message
        : "";
    const irWaiverDirty = irWaiverEditState.gameweekId === transferGameweek?.id
        && irWaiverEditState.dirty;
    const irWaiverMessage = irWaiverEditState.gameweekId === transferGameweek?.id
        ? irWaiverEditState.message
        : "";

    function updateWaiverEntries(nextEntries) {
        if (!transferGameweek?.id) return;
        waiverPlan.setEntries(nextEntries);
        setWaiverEditState({
            gameweekId: transferGameweek.id,
            dirty: true,
            message: "",
        });
    }

    async function saveWaiverEntries() {
        if (!transferGameweek?.id) return;
        setWaiverEditState((current) => ({ ...current, message: "" }));
        try {
            await waiverPlan.saveEntries(waiverPlan.entries);
            setWaiverEditState({
                gameweekId: transferGameweek.id,
                dirty: false,
                message: "",
            });
        } catch (saveError) {
            setWaiverEditState({
                gameweekId: transferGameweek.id,
                dirty: true,
                message: saveError.message || "The waiver plan could not be saved.",
            });
        }
    }

    function updateIrWaiverEntries(nextEntries) {
        if (!transferGameweek?.id || !hasActiveIrPlayer) return;
        irWaiverPlan.setEntries(nextEntries);
        setIrWaiverEditState({
            gameweekId: transferGameweek.id,
            dirty: true,
            message: "",
        });
    }

    async function saveIrWaiverEntries() {
        if (!transferGameweek?.id || !hasActiveIrPlayer) return;
        setIrWaiverEditState((current) => ({ ...current, message: "" }));
        try {
            await irWaiverPlan.saveEntries(irWaiverPlan.entries);
            setIrWaiverEditState({
                gameweekId: transferGameweek.id,
                dirty: false,
                message: "",
            });
        } catch (saveError) {
            setIrWaiverEditState({
                gameweekId: transferGameweek.id,
                dirty: true,
                message: saveError.message || "The IR waiver plan could not be saved.",
            });
        }
    }

    const loading = gameweeksLoading
        || playersQuery.isPending
        || teamsQuery.isPending
        || fixturesQuery.isPending
        || (hasUpcomingSquad && squadQuery.isPending)
        || (waiversEnabled && waiverPlan.loading)
        || (waiversEnabled && hasActiveIrPlayer && irWaiverPlan.loading);
    const error = gameweeksError
        || squadQuery.error?.message
        || waiverPlan.loadError?.message
        || irWaiverPlan.loadError?.message
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
                    onWaiverEntriesSave={waiversEnabled ? saveWaiverEntries : undefined}
                    waiverDirty={waiverDirty}
                    waiverSaving={waiverPlan.saving}
                    waiverMessage={waiverMessage}
                    waiverGameweekId={transferGameweek?.id}
                    irWaiverEntries={irWaiverPlan.entries}
                    onIrWaiverEntriesChange={hasActiveIrPlayer ? updateIrWaiverEntries : undefined}
                    onIrWaiverEntriesSave={hasActiveIrPlayer ? saveIrWaiverEntries : undefined}
                    irWaiverDirty={irWaiverDirty}
                    irWaiverSaving={irWaiverPlan.saving}
                    irWaiverMessage={irWaiverMessage}
                />
            }
            right={sidebar}
        />
    );
}

export default ScoutPage;
