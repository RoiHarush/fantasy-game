"use client";

import { useState } from "react";

import { useDraftAction, useDraftConfig } from "../../../features/draft/useDraft";
import { useMaintenanceLeagues } from "../../../features/league/useLeague";
import { Button } from "../../../shared/ui/Button";
import LeagueControlPage from "../Admin/LeagueControlPage";

function DraftMaintenancePanel({ league }) {
    const [draftTime, setDraftTime] = useState(null);
    const [message, setMessage] = useState("");
    const configQuery = useDraftConfig(league.id, { maintenance: true });
    const action = useDraftAction(league.id, {
        maintenance: true,
        onSuccess: (_result, draftAction) => {
            const messages = {
                schedule: "Draft scheduled.",
                open: "Draft started.",
                delete: "Draft schedule cleared.",
            };
            setMessage(messages[draftAction.type]);
        },
    });
    const configuredTime = configQuery.data?.scheduledTime?.slice(0, 16) ?? "";
    const effectiveDraftTime = draftTime ?? configuredTime;

    function runAction(draftAction) {
        setMessage("");
        action.mutate(draftAction);
    }

    return (
        <section className="mb-5 rounded-xl bg-white p-5 shadow-md" aria-labelledby="draft-maintenance-title">
            <h2 id="draft-maintenance-title" className="text-xl font-bold">Initial draft</h2>
            <p className="my-3">
                Current state: <strong>{league.status || "Unknown"}</strong>
                {configQuery.data?.scheduledTime && ` · scheduled for ${configQuery.data.scheduledTime}`}
            </p>
            {configQuery.isPending ? <p role="status">Loading draft configuration…</p> : (
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="datetime-local"
                        value={effectiveDraftTime}
                        onChange={event => setDraftTime(event.target.value)}
                        disabled={action.isPending}
                        className="rounded-lg border border-slate-300 p-2"
                    />
                    <Button disabled={!effectiveDraftTime || action.isPending} onClick={() => runAction({
                        type: "schedule",
                        time: effectiveDraftTime,
                    })}>Schedule draft</Button>
                    <Button variant="secondary" disabled={action.isPending} onClick={() => {
                        if (window.confirm("Start this league's initial draft now?")) {
                            runAction({ type: "open" });
                        }
                    }}>Open now</Button>
                    <Button variant="danger" disabled={action.isPending || !configQuery.data} onClick={() => runAction({ type: "delete" })}>Clear schedule</Button>
                </div>
            )}
            {(configQuery.error || action.error) && <p className="mt-3 text-red-700" role="alert">{(configQuery.error || action.error).message}</p>}
            {message && <p className="mt-3 text-emerald-700" role="status">{message}</p>}
        </section>
    );
}

export default function LeagueMaintenancePage() {
    const [selectedLeagueId, setSelectedLeagueId] = useState("");
    const leaguesQuery = useMaintenanceLeagues();
    const leagues = leaguesQuery.data ?? [];
    const selectedLeague = leagues.find(league => String(league.id) === selectedLeagueId);

    return (
        <div>
            <section className="mb-5 rounded-xl bg-white p-5 shadow-md" aria-labelledby="maintenance-title">
                <h1 id="maintenance-title" className="text-2xl font-bold">League maintenance</h1>
                <p className="my-3">Select one league before making changes. Every request carries its league ID explicitly; this does not make the super admin the league owner.</p>
                <label className="block max-w-xl font-bold">
                    Maintenance scope
                    <select
                        value={selectedLeagueId}
                        onChange={event => setSelectedLeagueId(event.target.value)}
                        disabled={leaguesQuery.isPending}
                        className="mt-2 block w-full rounded-lg border border-slate-300 p-2"
                    >
                        <option value="">No league selected</option>
                        {leagues.map(league => (
                            <option key={league.id} value={league.id}>
                                {league.name}{league.leagueCode ? ` (${league.leagueCode})` : ""} · {league.participantCount}/{league.maxParticipants}
                            </option>
                        ))}
                    </select>
                </label>
                {selectedLeague && <Button variant="ghost" className="mt-3" onClick={() => setSelectedLeagueId("")}>Exit maintenance scope</Button>}
                {leaguesQuery.error && <p className="mt-3 text-red-700" role="alert">{leaguesQuery.error.message}</p>}
            </section>

            {selectedLeague && (
                <>
                    <DraftMaintenancePanel key={selectedLeague.id} league={selectedLeague} />
                    <LeagueControlPage key={selectedLeague.id} maintenanceLeagueId={selectedLeague.id} />
                </>
            )}
        </div>
    );
}
