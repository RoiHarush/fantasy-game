import { Search, Shirt } from "lucide-react";
import { useMemo, useState } from "react";

import { findPlayers } from "../../../features/league-admin/playerSearch";
import { useUpdatePlayerPosition } from "../../../features/league-admin/useLeagueAdmin";
import { usePlayers } from "../../../features/players/usePlayers";
import PlayerKit from "../../General/PlayerKit";

const POSITIONS = [
    { id: 1, code: "GK", label: "Goalkeeper" },
    { id: 2, code: "DEF", label: "Defender" },
    { id: 3, code: "MID", label: "Midfielder" },
    { id: 4, code: "FWD", label: "Forward" },
];

function PositionManager({ maintenanceLeagueId = null }) {
    const playersQuery = usePlayers();
    const { players } = playersQuery;
    const [searchTerm, setSearchTerm] = useState("");
    const updatePosition = useUpdatePlayerPosition(maintenanceLeagueId);
    const searchResults = useMemo(
        () => findPlayers(players, searchTerm, { availableOnly: true }),
        [players, searchTerm],
    );
    const error = playersQuery.error?.message || updatePosition.error?.message;

    function handleChangePosition(player, position) {
        updatePosition.mutate({
            playerId: player.id,
            positionId: position.id,
            positionCode: position.code,
        });
    }

    return (
        <div className="space-y-4" aria-busy={playersQuery.isPending || updatePosition.isPending}>
            <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated">
                <header className="flex items-start gap-3 border-b border-app-border bg-app-surface-muted px-4 py-4 sm:px-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                        <Shirt className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                        <h2 className="text-base font-black text-app-foreground sm:text-xl">Player positions</h2>
                        <p className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">Correct a free agent&apos;s fantasy position when the source data needs an override.</p>
                    </div>
                </header>
                <div className="p-3 sm:p-5">
                    <label className="mb-2 block text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted" htmlFor="position-player-search">Find a free agent</label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-muted" aria-hidden="true" />
                        <input id="position-player-search" type="search" placeholder="Search free agents…" className="h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 pl-10 text-sm font-semibold text-app-foreground outline-none transition placeholder:text-app-muted focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                    </div>
                </div>
            </section>

            {playersQuery.isPending && <p className="rounded-2xl border border-app-border bg-app-surface-muted p-8 text-center text-sm font-semibold text-app-muted" role="status">Loading players…</p>}
            {error && <p className="rounded-xl border border-app-danger-border bg-app-danger-surface p-3 text-sm font-semibold text-app-danger-foreground" role="alert">{error}</p>}

            {!playersQuery.isPending && searchTerm.trim() && searchResults.length === 0 && (
                <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center text-sm font-semibold text-app-muted">No matching free agents.</p>
            )}

            <div className="space-y-2">
                {searchResults.map((player) => (
                    <article key={player.id} className="rounded-2xl border border-app-border bg-app-surface-elevated p-3 shadow-sm sm:flex sm:items-center sm:gap-4 sm:p-4">
                        <div className="flex min-w-0 items-center gap-3 sm:w-52 sm:shrink-0">
                            <PlayerKit teamId={player.teamId} type={player.position === "GK" ? "gk" : "field"} className="h-12 w-9 shrink-0 object-contain" draggable={false} />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-extrabold text-app-foreground sm:text-base">{player.viewName}</p>
                                <p className="text-xs font-semibold text-app-muted">Current: <strong className="text-app-accent-foreground">{player.position}</strong></p>
                            </div>
                        </div>
                        <div className="mt-3 grid flex-1 grid-cols-4 gap-1.5 sm:mt-0 sm:gap-2" aria-label={`Position for ${player.viewName}`}>
                            {POSITIONS.map((position) => {
                                const active = player.position === position.code;
                                const pending = updatePosition.isPending && updatePosition.variables?.playerId === player.id;
                                return (
                                    <button
                                        type="button"
                                        key={position.id}
                                        disabled={pending}
                                        onClick={() => handleChangePosition(player, position)}
                                        className={`h-10 rounded-xl border px-1 text-[0.68rem] font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent sm:text-xs ${active ? "border-app-accent bg-app-accent-surface text-app-accent-foreground shadow-sm" : "border-app-border bg-app-surface text-app-muted hover:border-app-accent-border hover:bg-app-accent-hover hover:text-app-foreground"}`}
                                        aria-pressed={active}
                                        aria-label={`Set ${player.viewName} as ${position.label}`}
                                    >
                                        {position.code}
                                    </button>
                                );
                            })}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}

export default PositionManager;
