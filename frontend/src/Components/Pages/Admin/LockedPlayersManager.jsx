import { LockKeyhole, Search, ShieldCheck, UnlockKeyhole } from "lucide-react";
import { useMemo, useState } from "react";

import { findPlayers } from "../../../features/league-admin/playerSearch";
import { useLockedPlayers } from "../../../features/league-admin/useLeagueAdmin";
import { usePlayers } from "../../../features/players/usePlayers";
import PlayerKit from "../../General/PlayerKit";

function PlayerIdentity({ player, position }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <PlayerKit teamId={player.teamId} type={position === "GK" ? "gk" : "field"} className="h-11 w-8 shrink-0 object-contain" draggable={false} />
            <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-app-foreground">{player.viewName}</p>
                <p className="text-xs font-semibold text-app-muted">{position}</p>
            </div>
        </div>
    );
}

function LockedPlayersManager({ maintenanceLeagueId = null }) {
    const playersQuery = usePlayers();
    const { players } = playersQuery;
    const [searchTerm, setSearchTerm] = useState("");
    const { query: lockedQuery, mutation: toggleLock } = useLockedPlayers(maintenanceLeagueId);
    const serverLockedPlayers = lockedQuery.data ?? [];
    const searchResults = useMemo(
        () => findPlayers(players, searchTerm, { availableOnly: true }),
        [players, searchTerm],
    );
    const error = playersQuery.error?.message
        || lockedQuery.error?.message
        || toggleLock.error?.message;

    function handleToggleLock(player, shouldLock) {
        toggleLock.mutate(
            { player, shouldLock },
            { onSuccess: () => shouldLock && setSearchTerm("") },
        );
    }

    return (
        <div className="space-y-4" aria-busy={playersQuery.isPending || lockedQuery.isPending || toggleLock.isPending}>
            <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated">
                <header className="flex items-start gap-3 border-b border-app-border bg-app-surface-muted px-4 py-4 sm:px-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-app-danger-border bg-app-danger-surface text-app-danger-foreground">
                        <LockKeyhole className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                        <h2 className="text-base font-black text-app-foreground sm:text-xl">Player locks</h2>
                        <p className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">Keep selected free agents unavailable until the league is ready to release them.</p>
                    </div>
                </header>
                <div className="p-3 sm:p-5">
                    <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted" htmlFor="lock-player-search">Find a free agent</label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-muted" aria-hidden="true" />
                        <input id="lock-player-search" type="search" placeholder="Search player to lock…" className="h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 pl-10 text-sm font-semibold text-app-foreground outline-none transition placeholder:text-app-muted focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mt-3 max-h-72 divide-y divide-app-border overflow-y-auto overscroll-contain rounded-xl border border-app-border bg-app-surface">
                            {searchResults.map((player) => (
                                <div key={player.id} className="flex items-center gap-3 px-3 py-2.5">
                                    <div className="min-w-0 flex-1"><PlayerIdentity player={player} position={player.position} /></div>
                                    <button type="button" onClick={() => handleToggleLock(player, true)} disabled={toggleLock.isPending} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-red-500 px-3 text-xs font-extrabold text-white transition hover:bg-red-600 disabled:opacity-50">
                                        <LockKeyhole className="size-3.5" aria-hidden="true" /> Lock
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {error && <p className="rounded-xl border border-app-danger-border bg-app-danger-surface p-3 text-sm font-semibold text-app-danger-foreground" role="alert">{error}</p>}

            <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated">
                <header className="flex items-center gap-3 border-b border-app-border bg-app-surface-muted px-4 py-4 sm:px-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-app-border bg-app-surface text-app-muted">
                        <ShieldCheck className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-app-foreground sm:text-lg">Currently locked</h3>
                        <p className="text-xs text-app-muted">These players cannot be claimed.</p>
                    </div>
                    <span className="grid size-8 place-items-center rounded-full border border-app-danger-border bg-app-danger-surface text-xs font-black tabular-nums text-app-danger-foreground">{serverLockedPlayers.length}</span>
                </header>

                {lockedQuery.isPending ? (
                    <p className="p-8 text-center text-sm font-semibold text-app-muted" role="status">Loading locked players…</p>
                ) : serverLockedPlayers.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                        <UnlockKeyhole className="mx-auto size-7 text-app-muted" aria-hidden="true" />
                        <p className="mt-3 text-sm font-extrabold text-app-foreground">No locked players</p>
                        <p className="mt-1 text-xs text-app-muted">All free agents are currently available.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-app-border">
                        {serverLockedPlayers.map((player) => {
                            const realPlayer = players.find((candidate) => String(candidate.id) === String(player.id));
                            const position = realPlayer?.position || player.position || "MID";
                            return (
                                <div key={player.id} className="flex items-center gap-3 px-3 py-3 sm:px-5">
                                    <div className="min-w-0 flex-1"><PlayerIdentity player={player} position={position} /></div>
                                    <button type="button" onClick={() => handleToggleLock(player, false)} disabled={toggleLock.isPending} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-300">
                                        <UnlockKeyhole className="size-3.5" aria-hidden="true" /> Unlock
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

export default LockedPlayersManager;
