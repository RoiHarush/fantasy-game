"use client";

import Link from "next/link";
import { useState } from "react";

import GameweekRoast from "../StatusTab/GameweekRoast";
import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useMaintenanceLeagues } from "../../../features/league/useLeague";
import { useObservedLeague, usePreviewLeagueRoast } from "../../../features/super-admin/useSuperAdmin";
import { Button } from "../../../shared/ui/Button";
import SelectField from "../../../shared/ui/SelectField";
import { Eye, LockKeyhole, ShieldCheck, Sparkles } from "../../../shared/ui/icons";

export default function LeagueObserverPage() {
    const [leagueId, setLeagueId] = useState("");
    const [managerId, setManagerId] = useState("");
    const [roastGameweekId, setRoastGameweekId] = useState("");
    const leagues = useMaintenanceLeagues();
    const league = useObservedLeague(leagueId);
    const gameweekState = useGameweek();
    const roastPreview = usePreviewLeagueRoast();
    const effectiveManagerId = managerId || league.data?.managers?.[0]?.userId || "";
    const effectiveRoastGameweekId = roastGameweekId
        || gameweekState.currentGameweek?.id
        || gameweekState.lastGameweek?.id
        || gameweekState.gameweeks?.[0]?.id
        || "";
    const manager = league.data?.managers?.find((item) => String(item.userId) === String(effectiveManagerId));
    const aiPreviewCount = roastPreview.data?.roasts?.filter((item) => item.generatedByAi).length ?? 0;
    const previewCount = roastPreview.data?.roasts?.length ?? 0;
    const aiProviderLabel = roastPreview.data?.provider === "gemini"
        ? "Gemini AI"
        : roastPreview.data?.provider === "groq" ? "Groq AI" : "AI";

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <header>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-500">Super Admin Observer</p>
                <h1 className="mt-1 text-2xl font-black text-app-foreground sm:text-3xl">Enter a league in read-only mode</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-app-muted">
                    Choose a league and manager, then browse the same navigation and screens they see. Your super-admin identity remains active and every write action is blocked.
                </p>
            </header>

            <section className="overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-panel">
                <div className="border-b border-app-border bg-app-surface-muted px-4 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-400">
                            <Eye className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="font-black text-app-foreground">League view session</h2>
                            <p className="mt-0.5 text-xs text-app-muted">The selected manager is used for display only, never for authentication.</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                    <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-app-muted">League</label>
                        <SelectField ariaLabel="League to observe" value={leagueId} onValueChange={(value) => {
                            setLeagueId(String(value));
                            setManagerId("");
                            roastPreview.reset();
                        }} options={[
                            { value: "", label: "Choose a league" },
                            ...(leagues.data ?? []).map((item) => ({ value: item.id, label: `${item.name} · ${item.participantCount} managers` })),
                        ]} />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-app-muted">Manager perspective</label>
                        <SelectField ariaLabel="Manager to observe" value={String(effectiveManagerId)} onValueChange={(value) => setManagerId(String(value))} disabled={!league.data} options={[
                            { value: "", label: league.isPending ? "Loading managers…" : "Choose a manager" },
                            ...(league.data?.managers ?? []).map((item) => ({ value: item.userId, label: `${item.fantasyTeamName} · ${item.managerName}` })),
                        ]} />
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-app-border bg-app-surface-muted px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-start gap-2 text-xs leading-5 text-app-muted">
                        <LockKeyhole className="mt-0.5 size-4 shrink-0 text-cyan-500" aria-hidden="true" />
                        <span>Only dedicated observer GET endpoints are used. Team saves, transfers, draft picks and settings changes are rejected.</span>
                    </div>
                    <Button asChild size="lg" disabled={!leagueId || !effectiveManagerId} className="shrink-0">
                        {leagueId && effectiveManagerId ? (
                            <Link href={`/observe/${leagueId}/${effectiveManagerId}/status`}>
                                <ShieldCheck className="size-4" aria-hidden="true" />
                                Enter read-only league
                            </Link>
                        ) : <span>Choose a league</span>}
                    </Button>
                </div>
            </section>

            {manager && (
                <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/8 px-4 py-3 text-sm text-app-foreground">
                    Ready to view <b>{manager.fantasyTeamName}</b> ({manager.managerName}) inside <b>{league.data?.name}</b>.
                </div>
            )}

            <section className="overflow-hidden rounded-3xl border border-brand-purple/30 bg-app-surface shadow-panel">
                <div className="border-b border-app-border bg-app-surface-muted px-4 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-2xl border border-brand-purple/30 bg-brand-purple/10 text-brand-purple dark:text-brand-cyan">
                            <Sparkles className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple dark:text-brand-cyan">Private preview</p>
                            <h2 className="mt-0.5 font-black text-app-foreground">Taste the league roast with current data</h2>
                            <p className="mt-1 text-xs leading-5 text-app-muted">Only your super-admin session can request this preview. It is not saved, published or shown to league managers.</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6">
                    <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-app-muted">Data snapshot</label>
                        <SelectField
                            ariaLabel="Gameweek for private roast preview"
                            value={String(effectiveRoastGameweekId)}
                            onValueChange={(value) => {
                                setRoastGameweekId(String(value));
                                roastPreview.reset();
                            }}
                            disabled={!gameweekState.gameweeks?.length}
                            options={[
                                { value: "", label: gameweekState.loading ? "Loading gameweeks…" : "Choose a gameweek" },
                                ...(gameweekState.gameweeks ?? []).map((item) => ({
                                    value: item.id,
                                    label: `Gameweek ${item.id}${item.id === gameweekState.currentGameweek?.id ? " · current live data" : item.calculated ? " · calculated" : ""}`,
                                })),
                            ]}
                        />
                    </div>
                    <Button
                        type="button"
                        size="lg"
                        disabled={!leagueId || !effectiveRoastGameweekId || roastPreview.isPending}
                        onClick={() => roastPreview.mutate({ leagueId, gameweekId: effectiveRoastGameweekId })}
                    >
                        <Sparkles className="size-4" aria-hidden="true" />
                        {roastPreview.isPending ? "Alex is writing…" : "Generate private preview"}
                    </Button>
                </div>

                {roastPreview.error && (
                    <p role="alert" className="mx-4 mb-5 rounded-xl border border-app-danger-border bg-app-danger-surface px-4 py-3 text-sm text-app-danger-foreground sm:mx-6">
                        {roastPreview.error.message}
                    </p>
                )}

                {roastPreview.data && (
                    <div className="border-t border-app-border px-4 pb-5 sm:px-6">
                        <GameweekRoast
                            gameweekId={Number(effectiveRoastGameweekId)}
                            available
                            featureEnabled
                            readOnly
                            previewFeed={roastPreview.data}
                        />
                        <p className="mt-3 text-xs leading-5 text-app-muted">
                            Generated privately for {previewCount} managers · {aiPreviewCount} by {aiProviderLabel} · {previewCount - aiPreviewCount} local fallback. Refreshing generates a fresh unsaved version.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
