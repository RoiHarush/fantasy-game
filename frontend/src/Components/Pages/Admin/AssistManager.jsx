import { Goal, LockKeyhole, Minus, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { findPlayers } from "../../../features/league-admin/playerSearch";
import { useAdminAssists } from "../../../features/league-admin/useLeagueAdmin";
import { usePlayers } from "../../../features/players/usePlayers";
import SelectField from "../../../shared/ui/SelectField";
import PlayerKit from "../../General/PlayerKit";

const fieldClassName = "h-11 w-full rounded-xl border border-app-border bg-app-surface-elevated px-3 text-sm font-semibold text-app-foreground outline-none transition placeholder:text-app-muted focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface disabled:cursor-not-allowed disabled:opacity-55";

function AssistManager({ maintenanceLeagueId = null }) {
    const playersQuery = usePlayers();
    const { players } = playersQuery;
    const gameweekState = useGameweek();
    const { currentGameweek } = gameweekState;
    const [selectedGameweek, setSelectedGameweek] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const gameweek = selectedGameweek ?? currentGameweek?.id;
    const { query: assistersQuery, mutation: updateAssist } = useAdminAssists(maintenanceLeagueId, gameweek);
    const assisters = assistersQuery.data ?? [];
    const isCurrentGW = currentGameweek && gameweek === currentGameweek.id;
    const isPastGW = currentGameweek && gameweek < currentGameweek.id;
    const canEdit = isPastGW || (isCurrentGW && currentGameweek.calculated);
    const searchResults = useMemo(() => findPlayers(players, searchTerm), [players, searchTerm]);
    const error = playersQuery.error?.message
        || assistersQuery.error?.message
        || updateAssist.error?.message
        || gameweekState.error;

    function handleUpdate(playerId, action) {
        if (!canEdit) return;
        updateAssist.mutate(
            { playerId, action },
            { onSuccess: () => setSearchTerm("") },
        );
    }

    return (
        <div className="space-y-4" aria-busy={playersQuery.isPending || assistersQuery.isPending || updateAssist.isPending}>
            <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated">
                <header className="flex items-start gap-3 border-b border-app-border bg-app-surface-muted px-4 py-4 sm:px-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                        <Goal className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-black text-app-foreground sm:text-xl">Assist manager</h2>
                            {!canEdit && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-app-danger-border bg-app-danger-surface px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-app-danger-foreground">
                                    <LockKeyhole className="size-3" aria-hidden="true" /> Locked
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">Review and correct credited assists for a completed gameweek.</p>
                    </div>
                </header>
                <div className="p-4 sm:p-5">
                    <label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted">
                        Gameweek
                        <SelectField
                            className={fieldClassName}
                            ariaLabel="Assists gameweek"
                            value={gameweek || ""}
                            onValueChange={(value) => setSelectedGameweek(Number(value))}
                            options={[...Array(currentGameweek ? currentGameweek.id : 1)].map((_, index) => ({
                                value: index + 1,
                                label: `Gameweek ${index + 1}`,
                            }))}
                        />
                    </label>
                </div>
            </section>

            <section className="rounded-2xl border border-app-border bg-app-surface-elevated p-3 sm:p-4">
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-muted" aria-hidden="true" />
                    <input
                        type="search"
                        aria-label="Search player for assist adjustment"
                        placeholder={canEdit ? "Search player to add an assist…" : "This gameweek is locked"}
                        className={`${fieldClassName} pl-10`}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        disabled={!canEdit}
                    />
                </div>
                {searchResults.length > 0 && (
                    <div className="mt-2 max-h-72 divide-y divide-app-border overflow-y-auto overscroll-contain rounded-xl border border-app-border bg-app-surface shadow-xl">
                        {searchResults.map((player) => (
                            <div key={player.id} className="flex items-center gap-3 px-3 py-2.5">
                                <PlayerKit teamId={player.teamId} type={player.position === "GK" ? "gk" : "field"} className="h-10 w-8 shrink-0 object-contain" draggable={false} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-extrabold text-app-foreground">{player.viewName}</p>
                                    <p className="text-xs text-app-muted">{player.position}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleUpdate(player.id, "ADD")}
                                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-emerald-500 px-3 text-xs font-extrabold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                                    disabled={!canEdit || updateAssist.isPending}
                                >
                                    <Plus className="size-3.5" aria-hidden="true" /> Add
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {error && <p className="rounded-xl border border-app-danger-border bg-app-danger-surface p-3 text-sm font-semibold text-app-danger-foreground" role="alert">{error}</p>}

            {(playersQuery.isPending || assistersQuery.isPending || gameweekState.loading) ? (
                <p className="rounded-2xl border border-app-border bg-app-surface-muted p-8 text-center text-sm font-semibold text-app-muted" role="status">Loading assists…</p>
            ) : assisters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-5 py-10 text-center">
                    <Goal className="mx-auto size-7 text-app-muted" aria-hidden="true" />
                    <p className="mt-3 text-sm font-extrabold text-app-foreground">No assists recorded yet</p>
                    <p className="mt-1 text-xs text-app-muted">Search for a player above when this gameweek is available for editing.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {assisters.map((item) => {
                        const realPlayer = players.find((player) => String(player.id) === String(item.playerId));
                        const position = realPlayer?.position || "MID";
                        return (
                            <article key={item.playerId} className="flex items-center gap-3 rounded-2xl border border-app-border bg-app-surface-elevated px-3 py-3 shadow-sm sm:px-4">
                                <PlayerKit teamId={item.teamId} type={position === "GK" ? "gk" : "field"} className="h-12 w-9 shrink-0 object-contain" draggable={false} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-extrabold text-app-foreground sm:text-base">{item.viewName}</p>
                                    <p className="text-xs font-semibold text-app-muted">Credited assists</p>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface-muted p-1">
                                    <button type="button" aria-label={`Remove one assist from ${item.viewName}`} onClick={() => handleUpdate(item.playerId, "REMOVE")} disabled={!canEdit || updateAssist.isPending} className="grid size-9 place-items-center rounded-lg bg-app-surface text-app-danger-foreground transition hover:bg-app-danger-surface disabled:opacity-45"><Minus className="size-4" aria-hidden="true" /></button>
                                    <strong className="min-w-7 text-center text-base tabular-nums text-app-foreground">{item.numOfAssist}</strong>
                                    <button type="button" aria-label={`Add one assist to ${item.viewName}`} onClick={() => handleUpdate(item.playerId, "ADD")} disabled={!canEdit || updateAssist.isPending} className="grid size-9 place-items-center rounded-lg bg-app-accent text-white transition hover:brightness-110 disabled:opacity-45"><Plus className="size-4" aria-hidden="true" /></button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default AssistManager;
