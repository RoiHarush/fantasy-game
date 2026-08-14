import { LockKeyhole, Minus, Plus, Search, ShieldAlert } from "@/src/shared/ui/icons";
import { useMemo, useState } from "react";

import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { findPlayers } from "../../../features/league-admin/playerSearch";
import { useAdminPenalties } from "../../../features/league-admin/useLeagueAdmin";
import { usePlayers } from "../../../features/players/usePlayers";
import SelectField from "../../../shared/ui/SelectField";
import PlayerKit from "../../General/PlayerKit";
import { Button } from "../../../shared/ui/Button";

const fieldClassName = "h-11 w-full rounded-xl border border-app-border bg-app-surface-elevated px-3 text-sm font-semibold text-app-foreground outline-none transition placeholder:text-app-muted focus:border-app-accent-border focus:ring-3 focus:ring-app-accent-surface disabled:cursor-not-allowed disabled:opacity-55";

function PenaltyManager({ maintenanceLeagueId = null }) {
    const playersQuery = usePlayers();
    const { players } = playersQuery;
    const gameweekState = useGameweek();
    const { currentGameweek } = gameweekState;
    const [selectedGameweek, setSelectedGameweek] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const gameweek = selectedGameweek ?? currentGameweek?.id;
    const { query: penaltiesQuery, mutation: updatePenalty } = useAdminPenalties(maintenanceLeagueId, gameweek);
    const punishedPlayers = penaltiesQuery.data ?? [];
    const isCurrentGW = currentGameweek && gameweek === currentGameweek.id;
    const isPastGW = currentGameweek && gameweek < currentGameweek.id;
    const canEdit = isPastGW || (isCurrentGW && currentGameweek.calculated);
    const searchResults = useMemo(() => findPlayers(players, searchTerm), [players, searchTerm]);
    const error = playersQuery.error?.message
        || penaltiesQuery.error?.message
        || updatePenalty.error?.message
        || gameweekState.error;

    function handlePunish(playerId, action) {
        if (!canEdit) return;
        updatePenalty.mutate(
            { playerId, action },
            { onSuccess: () => setSearchTerm("") },
        );
    }

    return (
        <div className="space-y-4" aria-busy={playersQuery.isPending || penaltiesQuery.isPending || updatePenalty.isPending}>
            <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface-elevated">
                <header className="flex items-start gap-3 border-b border-app-border bg-app-surface-muted px-4 py-4 sm:px-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-app-danger-border bg-app-danger-surface text-app-danger-foreground">
                        <ShieldAlert className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-black text-app-foreground sm:text-xl">Penalty conceded</h2>
                            {!canEdit && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-app-danger-border bg-app-danger-surface px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-app-danger-foreground">
                                    <LockKeyhole className="size-3" aria-hidden="true" /> Locked
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs leading-5 text-app-muted sm:text-sm">Record penalties conceded after a gameweek has been calculated.</p>
                    </div>
                </header>
                <div className="p-4 sm:p-5">
                    <label className="grid gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-app-muted">
                        Gameweek
                        <SelectField
                            className={fieldClassName}
                            ariaLabel="Penalties gameweek"
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
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-app-danger-foreground" aria-hidden="true" />
                    <input type="search" aria-label="Search player for penalty adjustment" placeholder={canEdit ? "Search player to record a penalty…" : "This gameweek is locked"} className={`${fieldClassName} pl-10`} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} disabled={!canEdit} />
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
                                <Button type="button" variant="danger" size="sm" onClick={() => handlePunish(player.id, "ADD")} className="gap-1 text-xs font-extrabold" disabled={!canEdit || updatePenalty.isPending}>
                                    <Plus className="size-3.5" aria-hidden="true" /> Record
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {error && <p className="rounded-xl border border-app-danger-border bg-app-danger-surface p-3 text-sm font-semibold text-app-danger-foreground" role="alert">{error}</p>}
            {(playersQuery.isPending || penaltiesQuery.isPending || gameweekState.loading) && <p className="rounded-2xl border border-app-border bg-app-surface-muted p-8 text-center text-sm font-semibold text-app-muted" role="status">Loading penalties…</p>}

            {!playersQuery.isPending && !penaltiesQuery.isPending && punishedPlayers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-5 py-10 text-center">
                    <ShieldAlert className="mx-auto size-7 text-app-muted" aria-hidden="true" />
                    <p className="mt-3 text-sm font-extrabold text-app-foreground">No penalties recorded</p>
                    <p className="mt-1 text-xs text-app-muted">Any manual corrections will appear here.</p>
                </div>
            )}

            <div className="space-y-2">
                {punishedPlayers.map((item) => {
                    const realPlayer = players.find((player) => String(player.id) === String(item.playerId));
                    const position = realPlayer?.position || "MID";
                    return (
                        <article key={item.playerId} className="flex items-center gap-3 rounded-2xl border border-app-danger-border bg-app-surface-elevated px-3 py-3 shadow-sm sm:px-4">
                            <PlayerKit teamId={item.teamId} type={position === "GK" ? "gk" : "field"} className="h-12 w-9 shrink-0 object-contain" draggable={false} />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-extrabold text-app-foreground sm:text-base">{item.viewName}</p>
                                <p className="text-xs font-bold text-app-danger-foreground">{item.penaltiesConceded} conceded · {item.penaltiesConceded * -2} pts</p>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface-muted p-1">
                                <Button type="button" variant="secondary" size="icon" aria-label={`Remove one penalty conceded from ${item.viewName}`} onClick={() => handlePunish(item.playerId, "REMOVE")} disabled={!canEdit || updatePenalty.isPending} className="size-9"><Minus className="size-4" aria-hidden="true" /></Button>
                                <strong className="min-w-7 text-center text-base tabular-nums text-app-foreground">{item.penaltiesConceded}</strong>
                                <Button type="button" variant="danger" size="icon" aria-label={`Add one penalty conceded to ${item.viewName}`} onClick={() => handlePunish(item.playerId, "ADD")} disabled={!canEdit || updatePenalty.isPending} className="size-9"><Plus className="size-4" aria-hidden="true" /></Button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default PenaltyManager;
