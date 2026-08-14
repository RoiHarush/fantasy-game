import { ArrowRight, ArrowRightLeft, HeartPulse } from "@/src/shared/ui/icons";
import { useMemo } from "react";

import { useAuth } from "../../../Context/AuthContext";
import { usePlayers } from "../../../features/players/usePlayers";
import { getIrTransferSourceLabel, splitTransferActions } from "../../../features/status/model";
import { useTransferHistory } from "../../../features/transfer-window/useTransferWindow";

function TransferActivityList({ gameWeekId, previewActions, previewPlayers }) {
    const playersQuery = usePlayers();
    const players = previewPlayers ?? playersQuery.players;
    const { user } = useAuth();
    const historyQuery = useTransferHistory(user?.leagueId, gameWeekId, {
        enabled: !Array.isArray(previewActions),
        staleTime: 30_000,
    });
    const preview = Array.isArray(previewActions);
    const actions = useMemo(
        () => (preview ? previewActions : historyQuery.data ?? []).filter((action) => action.windowType === "TRANSFER"),
        [historyQuery.data, preview, previewActions],
    );
    const pending = !preview && historyQuery.isPending;
    const error = !preview && historyQuery.error;
    return (
        <TransferActivityContent
            gameWeekId={gameWeekId}
            actions={actions}
            players={players}
            pending={pending}
            error={error}
        />
    );
}

export function TransferActivityContent({ gameWeekId, actions = [], players = [], pending = false, error = null }) {
    const playersById = useMemo(
        () => new Map(players.map((player) => [String(player.id), player])),
        [players],
    );
    const activity = useMemo(() => splitTransferActions(actions), [actions]);
    const playerName = (id) => playersById.get(String(id))?.viewName || `Player ${id}`;

    return (
        <section className="mt-7" aria-labelledby="transfer-activity-title">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-app-border pb-3">
                <div>
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-app-accent-foreground">Gameweek activity</p>
                    <h3 id="transfer-activity-title" className="mt-1 text-xl font-black text-app-foreground">
                        {gameWeekId ? `Gameweek ${gameWeekId} moves` : "Completed moves"}
                    </h3>
                </div>
                {actions.length > 0 && <span className="text-xs font-bold text-app-muted">{actions.length} completed</span>}
            </div>

            {pending ? (
                <p className="py-5 text-sm text-app-muted" role="status">Loading transfers…</p>
            ) : error ? (
                <p className="border-l-2 border-app-danger-border py-3 pl-4 text-sm font-semibold text-app-danger-foreground" role="alert">Transfer history is temporarily unavailable.</p>
            ) : actions.length === 0 ? (
                <p className="py-5 text-sm text-app-muted">No moves have been completed for this gameweek.</p>
            ) : (
                <div className="divide-y divide-app-border">
                    {activity.regular.length > 0 && (
                        <ActivitySection
                            title="Regular window"
                            Icon={ArrowRightLeft}
                            actions={activity.regular}
                            renderAction={(action) => (
                                <RegularTransfer action={action} playerName={playerName} />
                            )}
                        />
                    )}
                    {activity.ir.length > 0 && (
                        <ActivitySection
                            title="IR activity"
                            Icon={HeartPulse}
                            actions={activity.ir}
                            renderAction={(action) => (
                                <IrRelease action={action} playerName={playerName} />
                            )}
                        />
                    )}
                </div>
            )}
        </section>
    );
}

function ActivitySection({ title, Icon, actions, renderAction }) {
    return (
        <section className="py-4" aria-label={title}>
            <header className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.13em] text-app-muted">
                <Icon className="size-4 text-app-accent-foreground" aria-hidden="true" />
                <span>{title}</span>
                <span className="font-mono text-[0.65rem] text-app-accent-muted">{actions.length}</span>
            </header>
            <ol className="m-0 list-none divide-y divide-app-border p-0">
                {actions.map((action, index) => (
                    <li key={action.id ?? `${action.userId}-${index}`} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 py-3 sm:grid-cols-[2.5rem_minmax(8rem,.7fr)_minmax(0,1.4fr)] sm:items-center sm:gap-3">
                        <span className="font-mono text-xs font-bold tabular-nums text-app-accent-muted">{String(action.sequence ?? index + 1).padStart(2, "0")}</span>
                        {renderAction(action)}
                    </li>
                ))}
            </ol>
        </section>
    );
}

function ManagerName({ action }) {
    return <strong className="min-w-0 truncate text-sm text-app-foreground">{action.userName || "Unknown manager"}</strong>;
}

function RegularTransfer({ action, playerName }) {
    return (
        <>
            <ManagerName action={action} />
            <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm sm:col-start-auto">
                <strong className="min-w-0 truncate text-app-positive-foreground">{playerName(action.playerInId)}</strong>
                <ArrowRight className="size-3.5 shrink-0 text-app-muted" aria-hidden="true" />
                <span className="min-w-0 truncate font-semibold text-app-danger-foreground">{playerName(action.playerOutId)}</span>
                <small className="ml-auto text-[0.62rem] font-black uppercase tracking-wide text-app-muted">{action.source === "WAIVER" ? "Waiver" : "Manual"}</small>
            </div>
        </>
    );
}

function IrRelease({ action, playerName }) {
    return (
        <>
            <ManagerName action={action} />
            <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-2 text-sm text-app-muted sm:col-start-auto">
                <p className="min-w-0">
                    Released <strong className="text-app-danger-foreground">{playerName(action.playerOutId)}</strong> from IR
                </p>
                <small className="ml-auto text-[0.62rem] font-black uppercase tracking-wide text-app-muted">
                    {getIrTransferSourceLabel(action.source)}
                </small>
            </div>
        </>
    );
}

export default TransferActivityList;
