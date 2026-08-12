import { ArrowRight, ArrowRightLeft, Clock3 } from "lucide-react";
import { useMemo } from "react";

import PlayerKit from "../../General/PlayerKit";

export default function TransferActivityTable({
    actions = [],
    players = [],
    pending = false,
    error = null,
    mode = "transfer",
}) {
    const playersById = useMemo(
        () => new Map(players.map((player) => [String(player.id), player])),
        [players],
    );
    const isDraft = mode === "draft";

    if (pending) {
        return (
            <div className="grid min-h-72 place-items-center px-4 py-10 text-sm font-semibold text-app-muted" role="status">
                Loading completed moves…
            </div>
        );
    }

    if (error) {
        return (
            <p className="m-4 border-l-2 border-app-danger-border py-2 pl-4 text-sm font-semibold text-app-danger-foreground" role="alert">
                Completed moves are temporarily unavailable.
            </p>
        );
    }

    if (actions.length === 0) {
        return (
            <div className="grid min-h-72 place-items-center px-4 py-10 text-center">
                <div>
                    <Clock3 className="mx-auto size-5 text-app-muted" aria-hidden="true" />
                    <p className="mt-3 font-black text-app-foreground">No moves yet</p>
                    <p className="mt-1 text-sm text-app-muted">Completed {isDraft ? "draft picks" : "transfers"} will appear here live.</p>
                </div>
            </div>
        );
    }

    return (
        <section aria-label={isDraft ? "Drafted players" : "Completed transfers"}>
            <header className="grid grid-cols-[minmax(4.5rem,0.7fr)_minmax(0,1fr)_1.5rem_minmax(0,1fr)] items-center gap-2 border-b-2 border-app-border bg-app-surface-muted px-3 py-2 text-[0.56rem] font-black uppercase tracking-[0.12em] text-app-muted sm:grid-cols-[minmax(8rem,0.7fr)_minmax(9rem,1fr)_2rem_minmax(9rem,1fr)] sm:px-5 sm:text-xs">
                <span>Manager</span>
                <span>{isDraft ? "Selected" : "In"}</span>
                <span aria-hidden="true" />
                <span>{isDraft ? "Pick" : "Out"}</span>
            </header>
            <ol className="m-0 list-none p-0">
                {actions.map((action, index) => {
                    const incoming = playersById.get(String(action.playerInId));
                    const outgoing = playersById.get(String(action.playerOutId));
                    return (
                        <li
                            key={action.id ?? `${action.userId}-${action.playerInId}-${index}`}
                            className="grid min-h-16 grid-cols-[minmax(4.5rem,0.7fr)_minmax(0,1fr)_1.5rem_minmax(0,1fr)] items-center gap-2 border-b border-app-border px-3 py-2.5 text-xs sm:grid-cols-[minmax(8rem,0.7fr)_minmax(9rem,1fr)_2rem_minmax(9rem,1fr)] sm:px-5 sm:text-sm"
                        >
                            <div className="min-w-0">
                                <strong className="block truncate text-app-foreground">{action.userName || "Unknown manager"}</strong>
                                <span className="mt-0.5 block text-[0.56rem] font-black uppercase tracking-wide text-app-muted sm:text-[0.65rem]">
                                    {isDraft ? `Pick ${index + 1}` : action.source === "WAIVER" ? "Waiver" : "Manual"}
                                </span>
                            </div>
                            <ActivityPlayer player={incoming} fallback={`Player #${action.playerInId}`} tone="incoming" />
                            <span className={`grid size-6 place-items-center rounded-full ${isDraft ? "text-app-accent-foreground" : "text-app-muted"}`} aria-hidden="true">
                                {isDraft ? <ArrowRight size={14} /> : <ArrowRightLeft size={14} />}
                            </span>
                            {isDraft ? (
                                <strong className="font-mono text-sm tabular-nums text-app-accent-foreground sm:text-base">#{index + 1}</strong>
                            ) : (
                                <ActivityPlayer player={outgoing} fallback={action.playerOutId ? `Player #${action.playerOutId}` : "No player"} tone="outgoing" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

function ActivityPlayer({ player, fallback, tone }) {
    return (
        <div className="flex min-w-0 items-center gap-1.5">
            {player && (
                <PlayerKit
                    teamId={player.teamId}
                    type={player.position === "GK" ? "gk" : "field"}
                    className="h-7 w-7 shrink-0 select-none object-contain sm:h-9 sm:w-9"
                />
            )}
            <div className="min-w-0 leading-tight">
                <strong className={`block truncate ${tone === "incoming" ? "text-app-positive-foreground" : "text-app-danger-foreground"}`}>
                    {player?.viewName || fallback}
                </strong>
                {player?.position && <span className="text-[0.55rem] font-bold uppercase text-app-muted sm:text-[0.65rem]">{player.position}</span>}
            </div>
        </div>
    );
}
