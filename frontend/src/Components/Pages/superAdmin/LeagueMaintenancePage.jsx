"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import { useDraftAction, useDraftConfig } from "../../../features/draft/useDraft";
import { toDateTimeLocalInput } from "../../../features/draft/model";
import {
    findActiveGameweek,
    findGameweekScheduleConflict,
    gameweekLabel,
} from "../../../features/gameweeks/availability";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { formatAppDateTime } from "../../../lib/dateTime";
import { useMaintenanceLeagues } from "../../../features/league/useLeague";
import { Button } from "../../../shared/ui/Button";
import SelectField from "../../../shared/ui/SelectField";
import LeagueControlPage from "../Admin/LeagueControlPage";

function DraftMaintenancePanel({ league, gameweeks, currentGameweek, gameweeksLoading }) {
    const [draftTime, setDraftTime] = useState(null);
    const [message, setMessage] = useState("");
    const [pendingAction, setPendingAction] = useState(null);
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
            setPendingAction(null);
        },
    });
    const configuredTime = toDateTimeLocalInput(configQuery.data?.scheduledTime);
    const effectiveDraftTime = draftTime ?? configuredTime;
    const activeGameweek = findActiveGameweek(gameweeks, currentGameweek);
    const scheduleConflict = findGameweekScheduleConflict(gameweeks, effectiveDraftTime);
    const openBlockedReason = activeGameweek
        ? `Drafts cannot open while ${gameweekLabel(activeGameweek)} is active.`
        : "";
    const scheduleBlockedReason = scheduleConflict
        ? `Choose a time outside ${gameweekLabel(scheduleConflict)}.`
        : "";

    function runAction(draftAction) {
        if (draftAction.type === "open" && (gameweeksLoading || openBlockedReason)) return;
        if (draftAction.type === "schedule" && (gameweeksLoading || scheduleBlockedReason)) return;
        setMessage("");
        action.mutate(draftAction);
    }

    return (
        <section className="border-t border-app-border py-6" aria-labelledby="draft-maintenance-title">
            <h2 id="draft-maintenance-title" className="text-xl font-black text-app-foreground">Initial draft</h2>
            <p className="my-3 text-sm text-app-muted">
                Current state: <strong>{league.status || "Unknown"}</strong>
                {configQuery.data?.scheduledTime && ` · scheduled for ${formatAppDateTime(configQuery.data.scheduledTime)}`}
            </p>
            {configQuery.isPending ? <p role="status">Loading draft configuration…</p> : (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <input
                        type="datetime-local"
                        aria-label="Draft date and time"
                        value={effectiveDraftTime}
                        onChange={event => setDraftTime(event.target.value)}
                        disabled={action.isPending}
                        className="min-h-11 rounded-xl border border-app-border bg-app-surface-muted px-3 text-app-foreground outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15"
                    />
                    <Button disabled={!effectiveDraftTime || action.isPending || gameweeksLoading || Boolean(scheduleBlockedReason)} onClick={() => runAction({
                        type: "schedule",
                        time: effectiveDraftTime,
                    })}>Schedule draft</Button>
                    <Button variant="secondary" disabled={action.isPending || gameweeksLoading || Boolean(openBlockedReason)} onClick={() => setPendingAction("open")}>Open now</Button>
                    <Button variant="danger" disabled={action.isPending || !configQuery.data} onClick={() => setPendingAction("delete")}>Clear schedule</Button>
                </div>
            )}
            {(scheduleBlockedReason || openBlockedReason) && (
                <p className="mt-3 text-app-danger-foreground" role="status">
                    {scheduleBlockedReason || openBlockedReason}
                </p>
            )}
            {(configQuery.error || action.error) && <p className="mt-3 text-app-danger-foreground" role="alert">{(configQuery.error || action.error).message}</p>}
            {message && <p className="mt-3 text-app-positive-foreground" role="status">{message}</p>}

            <Dialog.Root open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-900 p-7 text-center text-white shadow-2xl focus:outline-none">
                        <Dialog.Title className="text-xl font-bold">
                            {pendingAction === "open" ? "Open this league's draft now?" : "Clear this league's draft schedule?"}
                        </Dialog.Title>
                        <Dialog.Description className="mt-3 text-slate-300">
                            This action is scoped only to {league.name}.
                        </Dialog.Description>
                        <div className="mt-6 flex justify-center gap-3">
                            <Dialog.Close asChild><Button variant="ghost" className="text-white">Cancel</Button></Dialog.Close>
                            <Button
                                variant="danger"
                                disabled={action.isPending || (pendingAction === "open" && Boolean(openBlockedReason))}
                                onClick={() => runAction({ type: pendingAction })}
                            >
                                {action.isPending ? "Saving…" : "Confirm"}
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </section>
    );
}

export default function LeagueMaintenancePage() {
    const [selectedLeagueId, setSelectedLeagueId] = useState("");
    const leaguesQuery = useMaintenanceLeagues();
    const gameweekState = useGameweek();
    const leagues = leaguesQuery.data ?? [];
    const selectedLeague = leagues.find(league => String(league.id) === selectedLeagueId);

    return (
        <div className="mx-auto max-w-5xl">
            <section className="pb-6" aria-labelledby="maintenance-title">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-amber-500">Scoped operations</p>
                <h1 id="maintenance-title" className="mt-1 text-2xl font-black text-app-foreground sm:text-3xl">League maintenance</h1>
                <p className="my-3 max-w-3xl text-sm leading-6 text-app-muted">Select one league before making changes. Every request carries its league ID explicitly; this does not make the super admin the league owner.</p>
                <label className="block max-w-xl text-sm font-bold text-app-foreground">
                    Maintenance scope
                    <SelectField
                        value={selectedLeagueId}
                        onValueChange={setSelectedLeagueId}
                        disabled={leaguesQuery.isPending}
                        options={[
                            { value: "", label: "No league selected" },
                            ...leagues.map((league) => ({
                                value: league.id,
                                label: `${league.name}${league.leagueCode ? ` (${league.leagueCode})` : ""} · ${league.participantCount}/${league.maxParticipants}`,
                            })),
                        ]}
                        ariaLabel="Maintenance scope"
                        className="mt-2 block w-full"
                    />
                </label>
                {selectedLeague && <Button variant="ghost" className="mt-3" onClick={() => setSelectedLeagueId("")}>Exit maintenance scope</Button>}
                {leaguesQuery.error && <p className="mt-3 text-app-danger-foreground" role="alert">{leaguesQuery.error.message}</p>}
            </section>

            {selectedLeague && (
                <>
                    <DraftMaintenancePanel
                        key={selectedLeague.id}
                        league={selectedLeague}
                        gameweeks={gameweekState.gameweeks}
                        currentGameweek={gameweekState.currentGameweek}
                        gameweeksLoading={gameweekState.loading}
                    />
                    <LeagueControlPage key={selectedLeague.id} maintenanceLeagueId={selectedLeague.id} />
                </>
            )}
        </div>
    );
}
