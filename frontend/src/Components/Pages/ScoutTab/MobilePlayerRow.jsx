import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRightLeft, Ellipsis, Eye, Info, ListPlus, LockKeyhole, X } from "lucide-react";
import { memo, useState } from "react";

import { getInitials } from "../../../lib/initials";
import { getPlayerInjuryColor } from "../../../lib/playerStatus";
import TeamShortNames from "../../../Utils/teamNameMap";
import PlayerInfoModal from "../../General/PlayerInfoModal";
import PlayerKit from "../../General/PlayerKit";

export function getMobilePlayerColumns(mode) {
    return mode === "scout"
        ? "minmax(0, 1fr) 1.55rem 2.9rem 2.55rem 1.9rem"
        : "minmax(0, 1fr) 1.55rem 2.9rem 2.8rem 1.9rem";
}

const MobilePlayerRow = memo(function MobilePlayerRow({
    player,
    team,
    user,
    mode,
    currentTurnUserId,
    nextGameweek,
    onCompare,
    isSelectedForCompare,
    onPlayerSelect,
    teamFixtures,
    ruleLocked = false,
    isWatched,
    onToggleWatch,
    watchlistUpdating,
    onWaiverSelect,
    waiverPlanned = false,
}) {
    const [showInfo, setShowInfo] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const injuryColor = getPlayerInjuryColor(player.chanceOfPlayingNextRound);
    const isMyTurn = String(currentTurnUserId) === String(user?.id);
    const ownerName = player.available
        ? "Free agent"
        : String(player.ownerId) === String(user?.id)
            ? user?.name || player.ownerName || "You"
            : player.ownerName || "Unknown manager";
    const fixtureLabel = getFixtureLabel(teamFixtures?.[String(nextGameweek)]);
    const canWaiver = Boolean(onWaiverSelect)
        && (player.available || (player.ownerId != null && String(player.ownerId) !== String(user?.id)));
    const canAcquire = player.available && !ruleLocked && isMyTurn;

    return (
        <>
            <article
                className="grid min-h-12 items-center gap-x-1 border-b border-app-border bg-app-surface px-2 py-1.5 text-app-foreground transition-colors hover:bg-app-accent-hover"
                style={{ gridTemplateColumns: getMobilePlayerColumns(mode) }}
            >
                <div className="flex min-w-0 items-center gap-1">
                    <button
                        type="button"
                        className="grid size-4 shrink-0 place-items-center p-0 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-app-accent"
                        style={{ color: injuryColor || "var(--app-muted)" }}
                        aria-label={`View ${player.viewName} information`}
                        onClick={() => setShowInfo(true)}
                    >
                        <Info aria-hidden="true" size={14} strokeWidth={2.1} />
                    </button>
                    <PlayerKit
                        teamId={player.teamId}
                        type={player.position === "GK" ? "gk" : "field"}
                        className="block shrink-0 object-contain"
                        style={{ width: "1.5rem", height: "1.5rem", maxWidth: "1.5rem", maxHeight: "1.5rem" }}
                    />
                    <div className="min-w-0 leading-tight">
                        <span className="block truncate text-[0.65rem] font-extrabold">{player.viewName}</span>
                        <span className="block truncate text-[0.5rem] font-semibold text-app-muted">
                            {team?.shortName || "-"} • {player.position}
                        </span>
                    </div>
                </div>

                <span className="text-center text-[0.62rem] font-extrabold">{player.points}</span>
                <span className="truncate text-center text-[0.55rem] font-bold text-app-muted" title={fixtureLabel}>{fixtureLabel}</span>

                {mode === "scout" ? (
                    <span className={`mx-auto inline-flex h-5 max-w-full items-center justify-center truncate rounded px-1.5 text-[0.48rem] font-extrabold uppercase ${player.available
                        ? "bg-app-surface-muted text-app-muted"
                        : String(player.ownerId) === String(user?.id)
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : "bg-app-accent-surface text-app-accent-foreground"
                    }`} title={ownerName} aria-label={`Owner: ${ownerName}`}>
                        {player.available ? "Free" : getInitials(ownerName)}
                    </span>
                ) : (
                    <button
                        type="button"
                        className="mx-auto h-6 rounded bg-component-gradient px-1.5 text-[0.52rem] font-extrabold text-brand-ink disabled:bg-app-surface-muted disabled:text-app-muted disabled:opacity-60"
                        disabled={!canAcquire}
                        onClick={() => canAcquire && onPlayerSelect?.(player)}
                    >
                        {canAcquire ? (mode === "draft" ? "Pick" : "Sign") : "Locked"}
                    </button>
                )}

                <button
                    type="button"
                    className="mx-auto grid size-7 place-items-center rounded-md border border-app-border bg-app-surface-muted text-app-muted transition hover:border-app-accent-border hover:text-app-foreground"
                    aria-label={`Open actions for ${player.viewName}`}
                    onClick={() => setShowActions(true)}
                >
                    <Ellipsis aria-hidden="true" size={15} />
                </button>
            </article>

            {showActions && (
                <MobilePlayerActions
                    player={player}
                    isSelectedForCompare={isSelectedForCompare}
                    isWatched={isWatched}
                    watchlistUpdating={watchlistUpdating}
                    canWaiver={canWaiver}
                    waiverPlanned={waiverPlanned}
                    onCompare={onCompare}
                    onToggleWatch={onToggleWatch}
                    onWaiverSelect={onWaiverSelect}
                    onClose={() => setShowActions(false)}
                />
            )}
            {showInfo && <PlayerInfoModal player={player} onClose={() => setShowInfo(false)} />}
        </>
    );
});

function MobilePlayerActions({
    player,
    isSelectedForCompare,
    isWatched,
    watchlistUpdating,
    canWaiver,
    waiverPlanned,
    onCompare,
    onToggleWatch,
    onWaiverSelect,
    onClose,
}) {
    const runAndClose = (action) => {
        onClose();
        action?.();
    };

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[5200] bg-black/65 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 z-[5201] w-[calc(100%-1rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-app-border bg-app-surface-elevated text-app-foreground shadow-2xl focus:outline-none">
                    <header className="flex items-center justify-between border-b border-app-border bg-component-gradient px-3.5 py-2.5 text-brand-ink">
                        <div className="min-w-0">
                            <span className="block text-[0.5rem] font-extrabold uppercase tracking-wider opacity-70">Player actions</span>
                            <Dialog.Title className="truncate text-[0.8rem] font-extrabold">{player.viewName}</Dialog.Title>
                        </div>
                        <Dialog.Close asChild>
                            <button type="button" className="grid size-7 shrink-0 place-items-center rounded-md bg-white/30" aria-label="Close actions">
                                <X aria-hidden="true" size={15} />
                            </button>
                        </Dialog.Close>
                    </header>
                    <div className="grid gap-2 p-2.5">
                        <ActionButton
                            icon={<ArrowRightLeft aria-hidden="true" size={15} />}
                            label={isSelectedForCompare ? "Selected for comparison" : "Compare player"}
                            disabled={isSelectedForCompare}
                            onClick={() => runAndClose(() => onCompare?.(player))}
                        />
                        <ActionButton
                            icon={<Eye aria-hidden="true" size={15} />}
                            label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                            disabled={watchlistUpdating}
                            onClick={() => runAndClose(onToggleWatch)}
                        />
                        {onWaiverSelect && (
                            <ActionButton
                                icon={canWaiver ? <ListPlus aria-hidden="true" size={15} /> : <LockKeyhole aria-hidden="true" size={15} />}
                                label={canWaiver ? (waiverPlanned ? "Edit waiver" : "Add waiver") : "Waiver unavailable"}
                                disabled={!canWaiver}
                                onClick={() => runAndClose(() => onWaiverSelect(player))}
                            />
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function ActionButton({ icon, label, disabled, onClick }) {
    return (
        <button
            type="button"
            className="flex h-10 items-center gap-2.5 rounded-lg border border-app-border bg-app-surface px-2.5 text-left text-[0.68rem] font-bold text-app-foreground transition hover:bg-app-accent-hover disabled:opacity-45"
            disabled={disabled}
            onClick={onClick}
        >
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-app-accent-surface text-app-accent-foreground">{icon}</span>
            {label}
        </button>
    );
}

function getFixtureLabel(fixture) {
    if (!fixture) return "-";
    const match = fixture.opponent.match(/^(.*)\s\((H|A)\)$/);
    const fullName = match ? match[1].trim() : fixture.opponent;
    const location = match ? match[2] : "";
    const shortName = TeamShortNames[fullName] || fullName;
    return `${shortName}${location ? ` (${location})` : ""}`;
}

export default MobilePlayerRow;
