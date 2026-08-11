"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import {
    BadgeCheck,
    Goal,
    LockKeyhole,
    Rows3,
    Save,
    Settings2,
    ShieldAlert,
    SlidersHorizontal,
    Trash2,
    Trophy,
    Users,
} from "lucide-react";
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
import { Button } from "../../../shared/ui/Button";
import CloseButton from "../../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../../shared/ui/ResponsiveDialog";

const managerLoading = () => (
    <div className="grid min-h-48 place-items-center rounded-2xl border border-app-border bg-app-surface-muted p-6 text-sm font-semibold text-app-muted" role="status">
        Loading league controls…
    </div>
);

const AssistManager = dynamic(() => import("./AssistManager"), { loading: managerLoading });
const PenaltyManager = dynamic(() => import("./PenaltyManager"), { loading: managerLoading });
const LockedPlayersManager = dynamic(() => import("./LockedPlayersManager"), { loading: managerLoading });
const PositionManager = dynamic(() => import("./PositionManager"), { loading: managerLoading });

const TAB_META = {
    settings: { label: "Settings", icon: Settings2 },
    managers: { label: "Managers", icon: Users },
    assists: { label: "Assists", icon: Goal },
    penalties: { label: "Penalties", icon: ShieldAlert },
    locks: { label: "Locks", icon: LockKeyhole },
    positions: { label: "Positions", icon: Rows3 },
};

const fieldClassName = "h-11 w-full rounded-xl border border-app-border bg-app-surface-elevated px-3 text-sm font-semibold text-app-foreground outline-none transition placeholder:text-app-muted focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface disabled:cursor-not-allowed disabled:opacity-60";

function Feedback({ error, message }) {
    if (!error && !message) return null;

    return (
        <div className="space-y-2" aria-live="polite">
            {error && (
                <p className="rounded-xl border border-app-danger-border bg-app-danger-surface px-3 py-2.5 text-sm font-semibold text-app-danger-foreground" role="alert">
                    {error.message}
                </p>
            )}
            {message && (
                <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
                    {message}
                </p>
            )}
        </div>
    );
}

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
    const visibleTabs = [
        "settings",
        ...(!maintenanceLeagueId && league.status !== "DRAFT_LIVE" && league.status !== "ACTIVE" ? ["managers"] : []),
        "assists",
        "penalties",
        "locks",
        "positions",
    ];

    function handleRemoveManager() {
        if (!managerToRemove) return;
        setMessage("");
        removeManager.mutate(managerToRemove);
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-3 py-5 text-app-foreground sm:px-6 sm:py-9 lg:py-12" aria-labelledby="league-control-title">
            <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel sm:rounded-3xl">
                <div className="h-1.5 bg-component-gradient" aria-hidden="true" />

                <header className="relative overflow-hidden border-b border-app-border bg-app-surface-muted px-4 py-5 sm:px-7 sm:py-7">
                    <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-app-accent-surface blur-3xl" aria-hidden="true" />
                    <div className="relative flex items-start gap-3 sm:gap-4">
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground shadow-sm sm:size-13 sm:rounded-2xl">
                            <Trophy className="size-5 sm:size-6" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-app-accent-foreground sm:text-xs">
                                {maintenanceLeagueId ? "Super admin maintenance" : "League admin"}
                            </p>
                            <h1 id="league-control-title" className="mt-1 text-xl font-black tracking-tight text-app-foreground sm:text-3xl">
                                League control
                            </h1>
                            <p className="mt-1 max-w-2xl text-xs leading-5 text-app-muted sm:text-sm sm:leading-6">
                                Configure league rules and manage the decisions that shape the season.
                            </p>
                        </div>
                    </div>

                    <div className="relative mt-4 flex flex-wrap gap-2 sm:ml-17">
                        {league.leagueCode && (
                            <span className="rounded-full border border-app-border bg-app-surface px-3 py-1 text-[0.68rem] font-bold text-app-muted sm:text-xs">
                                Invite code <strong className="ml-1 tracking-wider text-app-foreground">{league.leagueCode}</strong>
                            </span>
                        )}
                        <span className="rounded-full border border-app-border bg-app-surface px-3 py-1 text-[0.68rem] font-bold text-app-muted sm:text-xs">
                            <strong className="text-app-foreground">{league.participantCount}</strong> managers
                        </span>
                        <span className="rounded-full border border-app-accent-border bg-app-accent-surface px-3 py-1 text-[0.68rem] font-bold text-app-accent-foreground sm:text-xs">
                            {league.status?.replaceAll("_", " ") || "League ready"}
                        </span>
                    </div>
                </header>

                <nav className="border-b border-app-border bg-app-surface px-3 py-3 sm:px-6" aria-label="League administration sections">
                    <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-app-surface-muted p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
                        {visibleTabs.map((tab) => {
                            const { label, icon: Icon } = TAB_META[tab];
                            const selected = activeTab === tab;
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent sm:min-h-11 sm:flex-1 sm:px-4 sm:text-sm ${selected ? "bg-app-surface text-app-accent-foreground shadow-sm ring-1 ring-app-border" : "text-app-muted hover:bg-app-accent-hover hover:text-app-foreground"}`}
                                    onClick={() => {
                                        setActiveTab(tab);
                                        setMessage("");
                                    }}
                                >
                                    <Icon className="size-4" aria-hidden="true" />
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </nav>

                <div className="p-3 sm:p-6 lg:p-8">
                    {activeTab === "settings" && (
                        <form
                            className="space-y-5"
                            onSubmit={form.handleSubmit((values) => {
                                setMessage("");
                                saveSettings.mutate(values);
                            })}
                            noValidate
                        >
                            <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated">
                                <header className="flex items-start gap-3 border-b border-app-border bg-app-surface-muted px-4 py-4 sm:px-5">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                                        <SlidersHorizontal className="size-4" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <h2 className="text-sm font-black text-app-foreground sm:text-lg">General settings</h2>
                                        <p className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">Name the league and control its final capacity.</p>
                                    </div>
                                </header>
                                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
                                    <label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted">
                                        League name
                                        <input className={fieldClassName} aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
                                        {form.formState.errors.name && <span className="normal-case tracking-normal text-app-danger-foreground">{form.formState.errors.name.message}</span>}
                                    </label>
                                    <label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted">
                                        Maximum participants
                                        <input className={fieldClassName} type="number" min={league.participantCount} max="20" readOnly={capacityLocked} aria-disabled={capacityLocked} aria-invalid={Boolean(form.formState.errors.maxParticipants)} {...form.register("maxParticipants", { valueAsNumber: true })} />
                                        {capacityLocked && <span className="normal-case leading-4 tracking-normal text-app-muted">Locked because the initial draft has started.</span>}
                                        {form.formState.errors.maxParticipants && <span className="normal-case tracking-normal text-app-danger-foreground">{form.formState.errors.maxParticipants.message}</span>}
                                    </label>
                                </div>
                            </section>

                            <details className="group overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated" open>
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-app-border bg-app-surface-muted px-4 py-4 marker:hidden sm:px-5">
                                    <div>
                                        <h2 className="text-sm font-black text-app-foreground sm:text-lg">Scoring rules</h2>
                                        <p className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">Changes apply to the next points calculation for this league.</p>
                                    </div>
                                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-app-border bg-app-surface text-app-muted transition group-open:rotate-180" aria-hidden="true">⌄</span>
                                </summary>
                                <div className="grid max-h-[34rem] gap-2 overflow-y-auto overscroll-contain p-3 sm:grid-cols-2 sm:gap-3 sm:p-5">
                                    {scoringRuleFields.map((field, index) => (
                                        <label key={field.id} className="grid grid-cols-[minmax(0,1fr)_5.2rem] items-center gap-3 rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-xs font-bold text-app-foreground sm:text-sm">
                                            <span className="min-w-0 leading-5">{formatScoringRule(field.rule)}</span>
                                            <input type="hidden" {...form.register(`scoringRules.${index}.rule`)} />
                                            <input
                                                className={`${fieldClassName} h-10 px-2 text-center tabular-nums`}
                                                type="number"
                                                min="-100"
                                                max="100"
                                                aria-label={`${formatScoringRule(field.rule)} points`}
                                                aria-invalid={Boolean(form.formState.errors.scoringRules?.[index]?.points)}
                                                {...form.register(`scoringRules.${index}.points`, { valueAsNumber: true })}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </details>

                            <Feedback error={error} message={message} />
                            <div className="flex justify-end">
                                <Button type="submit" className="w-full sm:w-auto" disabled={saveSettings.isPending}>
                                    <Save className="size-4" aria-hidden="true" />
                                    {saveSettings.isPending ? "Saving…" : "Save league settings"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {activeTab === "managers" && (
                        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated" aria-label="League managers">
                            <header className="border-b border-app-border bg-app-surface-muted px-4 py-4 sm:px-5">
                                <h2 className="text-sm font-black text-app-foreground sm:text-lg">League managers</h2>
                                <p className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">Managers can be removed until the initial draft starts.</p>
                            </header>
                            <div className="divide-y divide-app-border">
                                {managers.map((manager) => {
                                    const isAdmin = String(manager.id) === String(league.adminId);
                                    return (
                                        <article key={manager.id} className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
                                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-app-accent-surface text-sm font-black uppercase text-app-accent-foreground ring-1 ring-app-accent-border">
                                                {manager.name?.trim()?.charAt(0) || "M"}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-extrabold text-app-foreground sm:text-base">{manager.name}</p>
                                                <p className="truncate text-xs text-app-muted sm:text-sm">{manager.fantasyTeamName}</p>
                                            </div>
                                            {isAdmin ? (
                                                <span className="whitespace-nowrap rounded-full border border-app-accent-border bg-app-accent-surface px-2.5 py-1 text-[0.65rem] font-extrabold text-app-accent-foreground sm:text-xs">League admin</span>
                                            ) : (
                                                <Button variant="danger" size="sm" disabled={removeManager.isPending} onClick={() => setManagerToRemove(manager)}>
                                                    <Trash2 className="size-4" aria-hidden="true" />
                                                    <span className="hidden sm:inline">Remove</span>
                                                </Button>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                            <div className="p-4 sm:p-5"><Feedback error={error} message={message} /></div>
                        </section>
                    )}

                    <div className="mx-auto max-w-4xl" hidden={activeTab === "settings" || activeTab === "managers"}>
                        {activeTab === "assists" && <AssistManager maintenanceLeagueId={maintenanceLeagueId} />}
                        {activeTab === "penalties" && <PenaltyManager maintenanceLeagueId={maintenanceLeagueId} />}
                        {activeTab === "locks" && <LockedPlayersManager maintenanceLeagueId={maintenanceLeagueId} />}
                        {activeTab === "positions" && <PositionManager maintenanceLeagueId={maintenanceLeagueId} />}
                    </div>
                </div>
            </section>

            <Dialog.Root open={Boolean(managerToRemove)} onOpenChange={(open) => !open && setManagerToRemove(null)}>
                <ResponsiveDialogSurface className="sm:w-[min(calc(100vw-1.5rem),27rem)]">
                        <div className="relative p-5 sm:p-7">
                            <Dialog.Close asChild>
                                <CloseButton className="absolute top-3 right-3" aria-label="Close confirmation" />
                            </Dialog.Close>
                            <span className="grid size-11 place-items-center rounded-xl bg-app-danger-surface text-app-danger-foreground ring-1 ring-app-danger-border">
                                <Trash2 className="size-5" aria-hidden="true" />
                            </span>
                            <Dialog.Title className="mt-4 text-xl font-black">Remove manager?</Dialog.Title>
                            <Dialog.Description className="mt-2 pr-3 text-sm leading-6 text-app-muted">
                                {managerToRemove?.name} will lose access to this league. This action is available only before the initial draft.
                            </Dialog.Description>
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <Dialog.Close asChild>
                                    <Button variant="secondary" className="border-app-border bg-app-surface-muted text-app-foreground hover:bg-app-accent-hover" disabled={removeManager.isPending}>Cancel</Button>
                                </Dialog.Close>
                                <Button variant="danger" onClick={handleRemoveManager} disabled={removeManager.isPending}>
                                    {removeManager.isPending ? "Removing…" : "Remove"}
                                </Button>
                            </div>
                        </div>
                </ResponsiveDialogSurface>
            </Dialog.Root>
        </main>
    );
}

function PageState({ children, error = false }) {
    return (
        <main className="mx-auto grid min-h-64 w-full max-w-5xl place-items-center px-4 py-10">
            <p className={`rounded-2xl border p-5 text-center text-sm font-semibold ${error ? "border-app-danger-border bg-app-danger-surface text-app-danger-foreground" : "border-app-border bg-app-surface text-app-muted shadow-sm"}`} role={error ? "alert" : "status"}>
                {children}
            </p>
        </main>
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
        return <PageState>Loading league settings…</PageState>;
    }
    const error = leagueQuery.error ?? managersQuery.error;
    if (error || !leagueQuery.data) {
        return <PageState error>{error?.message || "League is unavailable."}</PageState>;
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
