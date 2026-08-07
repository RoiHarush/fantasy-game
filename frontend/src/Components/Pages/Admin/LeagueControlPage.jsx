"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../../../Context/AuthContext";
import { leagueSettingsSchema } from "../../../features/league-control/schemas";
import { queryKeys } from "../../../lib/query/keys";
import {
    fetchMaintenanceLeague,
    fetchMyLeague,
    removeLeagueMember,
    updateLeagueSettings,
    updateMaintenanceLeagueSettings,
} from "../../../services/leagueService";
import { fetchAllUsers } from "../../../services/usersService";
import styles from "../../../Styles/LeagueControl.module.css";

const AssistManager = lazy(() => import("./AssistManager"));
const PenaltyManager = lazy(() => import("./PenaltyManager"));
const LockedPlayersManager = lazy(() => import("./LockedPlayersManager"));
const PositionManager = lazy(() => import("./PositionManager"));

function LeagueControlContent({ league, managers, maintenanceLeagueId, leagueQueryKey }) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("settings");
    const [message, setMessage] = useState("");
    const form = useForm({
        resolver: zodResolver(leagueSettingsSchema),
        defaultValues: {
            name: league.name,
            maxParticipants: league.maxParticipants,
            scoringRules: league.scoringRules || {},
        },
    });
    const saveSettings = useMutation({
        mutationFn: (values) => maintenanceLeagueId
            ? updateMaintenanceLeagueSettings(league.id, values)
            : updateLeagueSettings(league.id, values),
        onSuccess: (updated) => {
            queryClient.setQueryData(leagueQueryKey, updated);
            form.reset({
                name: updated.name,
                maxParticipants: updated.maxParticipants,
                scoringRules: updated.scoringRules || {},
            });
            setMessage("League settings saved.");
        },
    });
    const removeManager = useMutation({
        mutationFn: (manager) => removeLeagueMember(league.id, manager.id),
        onSuccess: (updated, manager) => {
            queryClient.setQueryData(leagueQueryKey, updated);
            queryClient.setQueryData(queryKeys.leagueUsers(league.id), (current = []) => (
                current.filter(item => item.id !== manager.id)
            ));
            setMessage(`${manager.name} was removed from the league.`);
        },
    });
    const error = saveSettings.error ?? removeManager.error;

    function handleRemoveManager(manager) {
        if (!window.confirm(`Remove ${manager.name} from this league?`)) return;
        setMessage("");
        removeManager.mutate(manager);
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

            <nav className={styles.tabs} aria-label="League administration sections">
                {[
                    ["settings", "Settings"],
                    ...(!maintenanceLeagueId && league.status !== "DRAFT_LIVE" && league.status !== "ACTIVE" ? [["managers", "Managers"]] : []),
                    ["assists", "Assists"],
                    ["penalties", "Penalties"],
                    ["locks", "Locks"],
                    ["positions", "Positions"],
                ].map(([tab, label]) => (
                    <button key={tab} type="button" className={activeTab === tab ? styles.activeTab : ""} aria-current={activeTab === tab ? "page" : undefined} onClick={() => setActiveTab(tab)}>{label}</button>
                ))}
            </nav>

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
                            <input type="number" min={league.participantCount} max="20" aria-invalid={Boolean(form.formState.errors.maxParticipants)} {...form.register("maxParticipants", { valueAsNumber: true })} />
                            {form.formState.errors.maxParticipants && <span className={styles.error}>{form.formState.errors.maxParticipants.message}</span>}
                        </label>
                    </div>

                    <details className={styles.rules} open>
                        <summary>Scoring rules</summary>
                        <p>Changes affect the next points calculation and are isolated to this league.</p>
                        <div className={styles.ruleGrid}>
                            {Object.keys(league.scoringRules || {}).sort().map(rule => (
                                <label key={rule}>
                                    {rule.replaceAll("_", " ").replace(".", " · ")}
                                    <input type="number" min="-100" max="100" {...form.register(`scoringRules.${rule}`, { valueAsNumber: true })} />
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
                            {manager.id === league.adminId
                                ? <strong>League admin</strong>
                                : <button type="button" disabled={removeManager.isPending} onClick={() => handleRemoveManager(manager)}>Remove</button>}
                        </div>
                    ))}
                    <div className={styles.feedback} aria-live="polite">
                        {error && <p className={styles.error}>{error.message}</p>}
                        {message && <p className={styles.success}>{message}</p>}
                    </div>
                </section>
            )}

            <div className={styles.playerControls} hidden={activeTab === "settings" || activeTab === "managers"}>
                <Suspense fallback={<p role="status">Loading league controls…</p>}>
                    {activeTab === "assists" && <AssistManager maintenanceLeagueId={maintenanceLeagueId} />}
                    {activeTab === "penalties" && <PenaltyManager maintenanceLeagueId={maintenanceLeagueId} />}
                    {activeTab === "locks" && <LockedPlayersManager maintenanceLeagueId={maintenanceLeagueId} />}
                    {activeTab === "positions" && <PositionManager maintenanceLeagueId={maintenanceLeagueId} />}
                </Suspense>
            </div>
        </section>
    );
}

function LeagueControlPage({ maintenanceLeagueId = null }) {
    const { user } = useAuth();
    const leagueQueryKey = maintenanceLeagueId
        ? queryKeys.maintenanceLeague(maintenanceLeagueId)
        : queryKeys.currentLeague(user?.leagueId);
    const leagueQuery = useQuery({
        queryKey: leagueQueryKey,
        queryFn: () => maintenanceLeagueId ? fetchMaintenanceLeague(maintenanceLeagueId) : fetchMyLeague(),
        enabled: Boolean(maintenanceLeagueId || user?.leagueId),
    });
    const managersQuery = useQuery({
        queryKey: queryKeys.leagueUsers(user?.leagueId),
        queryFn: fetchAllUsers,
        enabled: Boolean(!maintenanceLeagueId && user?.leagueId),
        staleTime: 60_000,
    });

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
            leagueQueryKey={leagueQueryKey}
        />
    );
}

export default LeagueControlPage;
