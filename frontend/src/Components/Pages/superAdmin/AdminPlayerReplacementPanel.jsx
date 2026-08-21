"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useMemo, useState } from "react";

import { useMaintenanceLeagues } from "../../../features/league/useLeague";
import {
    usePlayerReplacementLeague,
    usePlayerReplacementOptions,
    useReplacePlayerForManager,
} from "../../../features/super-admin/useSuperAdmin";
import { Button } from "../../../shared/ui/Button";
import SelectField from "../../../shared/ui/SelectField";
import { ArrowRightLeft, Search, ShieldCheck } from "../../../shared/ui/icons";

const positionLabels = {
    GOALKEEPER: "Goalkeeper",
    DEFENDER: "Defender",
    MIDFIELDER: "Midfielder",
    FORWARD: "Forward",
};

function PlayerCard({ player, tone = "neutral" }) {
    const tones = tone === "out"
        ? "border-red-400/35 bg-red-500/8"
        : tone === "in"
            ? "border-emerald-400/35 bg-emerald-500/8"
            : "border-app-border bg-app-surface-muted";

    if (!player) {
        return (
            <div className={`grid min-h-28 place-items-center rounded-2xl border border-dashed p-4 text-center text-sm font-semibold text-app-muted ${tones}`}>
                No player selected
            </div>
        );
    }

    return (
        <div className={`rounded-2xl border p-4 ${tones}`}>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-app-muted">
                {positionLabels[player.position] ?? player.position} · Team {player.teamId ?? "—"}
            </p>
            <p className="mt-1 text-lg font-black text-app-foreground">{player.viewName}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-app-muted">
                <span className="rounded-full border border-app-border px-2 py-1">ID {player.id}</span>
                <span className="rounded-full border border-app-border px-2 py-1">{player.points} pts</span>
                {player.supplementalDraftReserved && <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-1 text-fuchsia-400">NEW</span>}
                {player.injured && <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-amber-500">Flagged</span>}
                {player.captain && <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-cyan-500">Captain</span>}
                {player.viceCaptain && <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-1 text-cyan-500">Vice captain</span>}
                {player.firstPick && <span className="rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-1 text-violet-400">First Pick</span>}
            </div>
            {player.news && <p className="mt-3 text-xs leading-5 text-app-muted">{player.news}</p>}
        </div>
    );
}

export default function AdminPlayerReplacementPanel() {
    const [leagueId, setLeagueId] = useState("");
    const [userId, setUserId] = useState("");
    const [playerOutId, setPlayerOutId] = useState("");
    const [playerInId, setPlayerInId] = useState("");
    const [search, setSearch] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [message, setMessage] = useState(null);

    const leagues = useMaintenanceLeagues();
    const league = usePlayerReplacementLeague(leagueId);
    const options = usePlayerReplacementOptions(leagueId, userId);
    const replacement = useReplacePlayerForManager({
        onSuccess: (result) => {
            setMessage({ type: "success", text: result.message });
            setPlayerOutId("");
            setPlayerInId("");
            setSearch("");
            setConfirming(false);
        },
        onError: (error) => {
            setMessage({ type: "error", text: error.message });
            setConfirming(false);
        },
    });

    const selectLeague = (value) => {
        setLeagueId(value);
        setUserId("");
        setPlayerOutId("");
        setPlayerInId("");
        setSearch("");
        setMessage(null);
    };

    const selectManager = (value) => {
        setUserId(value);
        setPlayerOutId("");
        setPlayerInId("");
        setSearch("");
        setMessage(null);
    };

    const outgoing = options.data?.rosterPlayers?.find((player) => String(player.id) === String(playerOutId));
    const incoming = options.data?.availablePlayers?.find((player) => String(player.id) === String(playerInId));
    const incomingCandidates = useMemo(() => {
        if (!outgoing) return [];
        const term = search.trim().toLowerCase();
        return (options.data?.availablePlayers ?? [])
            .filter((player) => player.position === outgoing.position)
            .filter((player) => !term
                || player.viewName.toLowerCase().includes(term)
                || String(player.id).includes(term))
            .slice(0, 30);
    }, [options.data?.availablePlayers, outgoing, search]);

    const submit = () => {
        replacement.mutate({
            leagueId: Number(leagueId),
            userId: Number(userId),
            playerOutId: Number(playerOutId),
            playerInId: Number(playerInId),
        });
    };

    const busy = leagues.isPending || league.isPending || options.isPending || replacement.isPending;
    const canConfirm = Boolean(options.data?.allowed && outgoing && incoming && !replacement.isPending);

    return (
        <section className="rounded-3xl border border-cyan-400/25 bg-cyan-500/[0.04] p-4 sm:p-6">
            <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-500">
                    <ArrowRightLeft className="size-5" aria-hidden="true" />
                </span>
                <div>
                    <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-cyan-500">Safe roster correction</p>
                    <h2 className="mt-1 text-xl font-black text-app-foreground">Replace one player</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-app-muted">
                        The player stays in the same squad slot. Position, club limit, league ownership, live Gameweek and open-window rules are enforced again by the server when you confirm.
                    </p>
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
                <SelectField
                    ariaLabel="League for player replacement"
                    value={leagueId}
                    onValueChange={selectLeague}
                    placeholder="Choose league"
                    options={(leagues.data ?? []).map((item) => ({
                        value: item.id,
                        label: `${item.name} (${item.participantCount} managers)`,
                    }))}
                    disabled={replacement.isPending}
                />
                <SelectField
                    ariaLabel="Manager for player replacement"
                    value={userId}
                    onValueChange={selectManager}
                    placeholder="Choose manager"
                    options={(league.data?.managers ?? []).map((manager) => ({
                        value: manager.userId,
                        label: `${manager.fantasyTeamName} · ${manager.managerName}`,
                    }))}
                    disabled={!leagueId || replacement.isPending}
                />
            </div>

            {options.data && (
                <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${options.data.allowed ? "border-app-positive-border bg-app-positive-surface text-app-positive-foreground" : "border-app-danger-border bg-app-danger-surface text-app-danger-foreground"}`}>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4" aria-hidden="true" />
                        <strong>{options.data.allowed ? `Replacement is currently allowed for Gameweek ${options.data.gameweekId}.` : "Replacement is currently blocked."}</strong>
                    </div>
                    {options.data.blockingReasons?.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                            {options.data.blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}
                        </ul>
                    )}
                </div>
            )}

            {options.data?.allowed && (
                <>
                    <div className="mt-5 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
                        <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-app-muted" htmlFor="admin-player-out">Release</label>
                            <SelectField
                                id="admin-player-out"
                                ariaLabel="Outgoing player"
                                value={playerOutId}
                                onValueChange={(value) => {
                                    setPlayerOutId(value);
                                    setPlayerInId("");
                                    setSearch("");
                                }}
                                placeholder="Choose squad player"
                                options={(options.data.rosterPlayers ?? []).map((player) => ({
                                    value: player.id,
                                    label: `${player.viewName} · ${positionLabels[player.position] ?? player.position}`,
                                }))}
                                disabled={replacement.isPending}
                            />
                            <div className="mt-3"><PlayerCard player={outgoing} tone="out" /></div>
                        </div>

                        <ArrowRightLeft className="mx-auto hidden size-6 self-center text-cyan-500 md:block" aria-hidden="true" />

                        <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-app-muted" htmlFor="admin-player-search">Sign</label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-app-muted" aria-hidden="true" />
                                <input
                                    id="admin-player-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={outgoing ? `Search free ${positionLabels[outgoing.position]?.toLowerCase()}…` : "Choose the outgoing player first"}
                                    className="min-h-11 w-full rounded-xl border border-app-border bg-app-surface-elevated py-2.5 pr-3 pl-10 text-sm font-semibold text-app-foreground outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/15 disabled:opacity-50"
                                    disabled={!outgoing || replacement.isPending}
                                />
                            </div>
                            {outgoing && search && (
                                <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-app-border bg-app-surface-elevated p-1.5 shadow-xl">
                                    {incomingCandidates.length > 0 ? incomingCandidates.map((player) => (
                                        <button
                                            key={player.id}
                                            type="button"
                                            onClick={() => {
                                                setPlayerInId(String(player.id));
                                                setSearch(player.viewName);
                                            }}
                                            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-app-accent-hover"
                                        >
                                            <span className="flex items-center gap-2 font-bold text-app-foreground">
                                                {player.viewName}
                                                {player.supplementalDraftReserved && <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-1.5 py-0.5 text-[0.6rem] font-black text-fuchsia-400">NEW</span>}
                                            </span>
                                            <span className="shrink-0 text-xs font-semibold text-app-muted">Team {player.teamId ?? "—"} · {player.points} pts</span>
                                        </button>
                                    )) : <p className="px-3 py-4 text-center text-sm text-app-muted">No matching free players.</p>}
                                </div>
                            )}
                            <div className="mt-3"><PlayerCard player={incoming} tone="in" /></div>
                        </div>
                    </div>

                    <Button
                        type="button"
                        className="mt-5 w-full sm:w-auto"
                        onClick={() => setConfirming(true)}
                        disabled={!canConfirm}
                    >
                        Review replacement
                    </Button>
                </>
            )}

            {(leagues.error || league.error || options.error) && (
                <div className="mt-4 rounded-xl border border-app-danger-border bg-app-danger-surface px-4 py-3 text-sm font-semibold text-app-danger-foreground" role="alert">
                    {(leagues.error || league.error || options.error).message}
                </div>
            )}
            {message && (
                <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${message.type === "success" ? "border-app-positive-border bg-app-positive-surface text-app-positive-foreground" : "border-app-danger-border bg-app-danger-surface text-app-danger-foreground"}`} role={message.type === "error" ? "alert" : "status"}>
                    {message.text}
                </div>
            )}
            {busy && leagueId && <p className="mt-3 text-xs font-semibold text-app-muted" role="status">Refreshing authoritative league data…</p>}

            <Dialog.Root open={confirming} onOpenChange={setConfirming}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-slate-950 p-6 text-white shadow-2xl focus:outline-none sm:p-7">
                        <Dialog.Title className="text-xl font-black">Confirm controlled replacement</Dialog.Title>
                        <Dialog.Description className="mt-2 text-sm leading-6 text-slate-300">
                            This will release <strong className="text-white">{outgoing?.viewName}</strong> and assign <strong className="text-white">{incoming?.viewName}</strong> to {options.data?.fantasyTeamName}. The server will lock the league and re-check every safety rule before committing.
                        </Dialog.Description>
                        {outgoing?.firstPick && (
                            <p className="mt-3 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200">
                                This player holds First Pick status. Releasing him follows the normal transfer rule: First Pick status is removed, and an active First Pick Captain chip is forfeited.
                            </p>
                        )}
                        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
                            <PlayerCard player={outgoing} tone="out" />
                            <ArrowRightLeft className="mx-auto size-5 self-center text-cyan-400" aria-hidden="true" />
                            <PlayerCard player={incoming} tone="in" />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <Dialog.Close asChild><Button variant="ghost" className="text-white" disabled={replacement.isPending}>Cancel</Button></Dialog.Close>
                            <Button variant="danger" onClick={submit} disabled={!canConfirm}>
                                {replacement.isPending ? "Replacing…" : "Confirm replacement"}
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </section>
    );
}
