import { useMemo } from "react";
import { useAuth } from "../../../Context/AuthContext";
import { usePlayers } from "../../../features/players/usePlayers";
import { groupTransferActions } from "../../../features/status/model";
import { useTransferHistory } from "../../../features/transfer-window/useTransferWindow";

function TransferActivityList({ gameWeekId }) {
    const { players } = usePlayers();
    const { user } = useAuth();
    const historyQuery = useTransferHistory(user?.leagueId, gameWeekId, {
        staleTime: 30_000,
    });
    const actions = useMemo(
        () => (historyQuery.data ?? []).filter(action => action.windowType === "TRANSFER"),
        [historyQuery.data],
    );

    const playersById = useMemo(
        () => new Map(players.map(player => [player.id, player])),
        [players]
    );
    const grouped = useMemo(() => groupTransferActions(actions), [actions]);

    const playerName = id => playersById.get(id)?.viewName || `Player #${id}`;

    return (
        <section className="mt-6">
            <h3 className="text-xl font-bold text-app-foreground">{gameWeekId ? `Gameweek ${gameWeekId} transfers` : "Gameweek transfers"}</h3>
            {historyQuery.isPending ? (
                <p className="mt-2 text-app-muted" role="status">Loading transfers…</p>
            ) : historyQuery.error ? (
                <p className="mt-2 text-red-600 dark:text-red-300" role="alert">Transfer history is temporarily unavailable.</p>
            ) : actions.length === 0 ? (
                <p className="mt-2 text-app-muted">No transfers have been completed for this gameweek.</p>
            ) : (
                <div className="mt-3 grid gap-3">
                    {[...grouped.entries()].map(([userId, group]) => (
                        <article key={userId} className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/70 dark:bg-violet-950/25">
                            <h4 className="mb-2 font-bold text-brand-ink dark:text-violet-200">{group.name}</h4>
                            <ul className="grid list-none gap-2 p-0">
                                {group.actions.map(action => (
                                    <li key={action.id} className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[1fr_1fr_auto] sm:gap-3">
                                        <span className="font-bold text-emerald-700 dark:text-emerald-300">IN {playerName(action.playerInId)}</span>
                                        <span className="font-bold text-red-700 dark:text-red-300">OUT {playerName(action.playerOutId)}</span>
                                        <small className="text-app-muted">{action.source === "WAIVER" ? "Waiver" : "Manual"}</small>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default TransferActivityList;
