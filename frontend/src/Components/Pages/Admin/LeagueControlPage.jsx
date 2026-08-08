"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { useAuth } from "../../../Context/AuthContext";
import { leagueSettingsSchema } from "../../../features/league-control/schemas";
import {
    formatScoringRule,
    toScoringRuleRows,
} from "../../../features/league/scoringRules";
import {
    useCurrentLeague,
    useLeagueUsers,
    useMaintenanceLeague,
    useRemoveLeagueMember,
    useUpdateLeagueSettings,
} from "../../../features/league/useLeague";
import styles from "../../../Styles/LeagueControl.module.css";

const managerLoading = () => <p role="status">Loading league controls…</p>;
const AssistManager = dynamic(() => import("./AssistManager"), { loading: managerLoading });
const PenaltyManager = dynamic(() => import("./PenaltyManager"), { loading: managerLoading });
const LockedPlayersManager = dynamic(() => import("./LockedPlayersManager"), { loading: managerLoading });
const PositionManager = dynamic(() => import("./PositionManager"), { loading: managerLoading });

function LeagueControlContent({ league, managers, maintenanceLeagueId }) {
    const [activeTab, setActiveTab] = useState("settings");
    const [message, setMessage] = useState("");
    const [managerToRemove, setManagerToRemove] = useState(null);
    const form = useForm({
        resolver: zodResolver(leagueSettingsSchema),
        defaultValues: {
            name: league.name,
            maxParticipants: league.maxParticipants,
            scoringRules: toScoringRuleRows(league.scoringRules),
        },
    });
    const scoringRuleFields = useFieldArray({
        control: form.control,
        name: "scoringRules",
    }).fields;
    const saveSettings = useUpdateLeagueSettings({
        leagueId: league.id,
        maintenance: Boolean(maintenanceLeagueId),
        onSuccess: (updated) => {
            form.reset({
                name: updated.name,
                maxParticipants: updated.maxParticipants,
                scoringRules: toScoringRuleRows(updated.scoringRules),
            });
            setMessage("League settings saved.");
        },
    });
    const removeManager = useRemoveLeagueMember(league.id, {
        onSuccess: (_updated, manager) => {
            setMessage(`${manager.name} was removed from the league.`);
            setManagerToRemove(null);
        },
    });
    const error = saveSettings.error ?? removeManager.error;
    const capacityLocked = !maintenanceLeagueId
        && (league.status === "DRAFT_LIVE" || league.status === "ACTIVE");

    function handleRemoveManager() {
        if (!managerToRemove) return;
        setMessage("");
        removeManager.mutate(managerToRemove);
    }

    return (
        <section className={styles.page} aria-labelledby="league-control-title">
            <header>
                <p className={styles.eyebrow}>{maintenanceLeagueId ? "Super admin maintenance" : "League admin"}</p>
                <h1 id="league-control-title">League settings</h1>
                <p>
                    {league.leagueCode && <>Invite code: <strong>{league.leagueCode}</strong> · </>}
                    {league.participantCount} current managers
                </p>
            </header>

            <div className={styles.tabs} role="tablist" aria-label="League administration sections">
                {[
                    ["settings", "Settings"],
                    ...(!maintenanceLeagueId && league.status !== "DRAFT_LIVE" && league.status !== "ACTIVE" ? [["managers", "Managers"]] : []),
                    ["assists", "Assists"],
                    ["penalties", "Penalties"],
                    ["locks", "Locks"],
                    ["positions", "Positions"],
                ].map(([tab, label]) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        className={activeTab === tab ? styles.activeTab : ""}
                        onClick={() => setActiveTab(tab)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === "settings" && (
                <form className={styles.form} onSubmit={form.handleSubmit(values => {
                    setMessage("");
                    saveSettings.mutate(values);
                })} noValidate>
                    <div className={styles.generalGrid}>
                        <label>
                            League name
                            <input aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
                            {form.formState.errors.name && <span className={styles.error}>{form.formState.errors.name.message}</span>}
                        </label>
                        <label>
                            Maximum participants
                            <input type="number" min={league.participantCount} max="20" readOnly={capacityLocked} aria-disabled={capacityLocked} aria-invalid={Boolean(form.formState.errors.maxParticipants)} {...form.register("maxParticipants", { valueAsNumber: true })} />
                            {capacityLocked && <span>The league size is locked because the initial draft has started.</span>}
                            {form.formState.errors.maxParticipants && <span className={styles.error}>{form.formState.errors.maxParticipants.message}</span>}
                        </label>
                    </div>

                    <details className={styles.rules} open>
                        <summary>Scoring rules</summary>
                        <p>Changes affect the next points calculation and are isolated to this league.</p>
                        <div className={styles.ruleGrid}>
                            {scoringRuleFields.map((field, index) => (
                                <label key={field.id}>
                                    {formatScoringRule(field.rule)}
                                    <input type="hidden" {...form.register(`scoringRules.${index}.rule`)} />
                                    <input
                                        type="number"
                                        min="-100"
                                        max="100"
                                        aria-invalid={Boolean(form.formState.errors.scoringRules?.[index]?.points)}
                                        {...form.register(`scoringRules.${index}.points`, { valueAsNumber: true })}
                                    />
                                </label>
                            ))}
                        </div>
                    </details>

                    <div className={styles.feedback} aria-live="polite">
                        {error && <p className={styles.error}>{error.message}</p>}
                        {message && <p className={styles.success}>{message}</p>}
                    </div>
                    <button className={styles.save} disabled={saveSettings.isPending}>{saveSettings.isPending ? "Saving…" : "Save league settings"}</button>
                </form>
            )}

            {activeTab === "managers" && (
                <section className={styles.form} aria-label="League managers">
                    <p>Managers can be removed until the initial draft starts.</p>
                    {managers.map(manager => (
                        <div key={manager.id} className="flex items-center justify-between gap-4 border-b border-slate-200 py-3">
                            <span>{manager.name} · {manager.fantasyTeamName}</span>
                            {String(manager.id) === String(league.adminId)
                                ? <strong>League admin</strong>
                                : <button type="button" disabled={removeManager.isPending} onClick={() => setManagerToRemove(manager)}>Remove</button>}
                        </div>
                    ))}
                    <div className={styles.feedback} aria-live="polite">
                        {error && <p className={styles.error}>{error.message}</p>}
                        {message && <p className={styles.success}>{message}</p>}
                    </div>
                </section>
            )}

            <div className={styles.playerControls} hidden={activeTab === "settings" || activeTab === "managers"}>
                {activeTab === "assists" && <AssistManager maintenanceLeagueId={maintenanceLeagueId} />}
                {activeTab === "penalties" && <PenaltyManager maintenanceLeagueId={maintenanceLeagueId} />}
                {activeTab === "locks" && <LockedPlayersManager maintenanceLeagueId={maintenanceLeagueId} />}
                {activeTab === "positions" && <PositionManager maintenanceLeagueId={maintenanceLeagueId} />}
            </div>

            <Dialog.Root open={Boolean(managerToRemove)} onOpenChange={(open) => !open && setManagerToRemove(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,25rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-900 p-7 text-center text-white shadow-2xl focus:outline-none">
                        <Dialog.Title className="text-xl font-bold">Remove manager?</Dialog.Title>
                        <Dialog.Description className="mt-3 text-slate-300">
                            {managerToRemove?.name} will lose access to this league. This is only available before the initial draft.
                        </Dialog.Description>
                        <div className="mt-6 flex justify-center gap-3">
                            <Dialog.Close asChild>
                                <button type="button" disabled={removeManager.isPending}>Cancel</button>
                            </Dialog.Close>
                            <button type="button" onClick={handleRemoveManager} disabled={removeManager.isPending}>
                                {removeManager.isPending ? "Removing…" : "Remove"}
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </section>
    );
}

function LeagueControlPage({ maintenanceLeagueId = null }) {
    const { user } = useAuth();
    const currentLeagueQuery = useCurrentLeague(user?.leagueId, {
        enabled: !maintenanceLeagueId,
    });
    const maintenanceLeagueQuery = useMaintenanceLeague(maintenanceLeagueId);
    const leagueQuery = maintenanceLeagueId ? maintenanceLeagueQuery : currentLeagueQuery;
    const managersQuery = useLeagueUsers(user?.leagueId, { enabled: !maintenanceLeagueId });

    if (leagueQuery.isPending || (!maintenanceLeagueId && managersQuery.isPending)) {
        return <section className={styles.page}><p>Loading league settings…</p></section>;
    }
    const error = leagueQuery.error ?? managersQuery.error;
    if (error || !leagueQuery.data) {
        return <section className={styles.page}><p className={styles.error}>{error?.message || "League is unavailable."}</p></section>;
    }

    return (
        <LeagueControlContent
            key={`${maintenanceLeagueId ?? "league"}-${leagueQuery.data.id}`}
            league={leagueQuery.data}
            managers={managersQuery.data ?? []}
            maintenanceLeagueId={maintenanceLeagueId}
        />
    );
}

export default LeagueControlPage;
