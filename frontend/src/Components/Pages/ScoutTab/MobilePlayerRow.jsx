import { ArrowRightLeft, Eye, Info, ListPlus, LockKeyhole } from "lucide-react";
import { memo, useState } from "react";

import { getInitials } from "../../../lib/initials";
import { getPlayerInjuryColor } from "../../../lib/playerStatus";
import { getFixtureItems } from "../../../features/fixtures/model";
import PlayerInfoModal from "../../General/PlayerInfoModal";
import PlayerKit from "../../General/PlayerKit";

export function getMobilePlayerColumns(mode, hasWaiverAction = false) {
    if (mode === "scout") {
        return hasWaiverAction
            ? "minmax(0, 1fr) 1.35rem 2.5rem 1.8rem 2.15rem 2.2rem 1.7rem"
            : "minmax(0, 1fr) 1.35rem 2.5rem 1.8rem 2.15rem 2.2rem";
    }
    return "minmax(0, 1fr) 1.35rem 2.5rem 1.8rem 2.15rem 2.8rem";
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
}) {
    const [showInfo, setShowInfo] = useState(false);
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
                style={{ gridTemplateColumns: getMobilePlayerColumns(mode, Boolean(onWaiverSelect)) }}
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
                        <span className="block truncate text-[0.65rem] font-extrabold" title={player.viewName}>{player.viewName}</span>
                        <span className="block truncate text-[0.5rem] font-semibold text-app-muted">
                            {team?.shortName || "-"} • {player.position}
                        </span>
                    </div>
                </div>

                <span className="text-center text-[0.62rem] font-extrabold">{player.points}</span>
                <span className="truncate text-center text-[0.55rem] font-bold text-app-muted" title={fixtureLabel}>{fixtureLabel}</span>

                <MobileActionButton
                    label={isSelectedForCompare ? `${player.viewName} is selected for comparison` : `Compare ${player.viewName}`}
                    active={isSelectedForCompare}
                    disabled={isSelectedForCompare}
                    onClick={() => onCompare?.(player)}
                >
                    <ArrowRightLeft aria-hidden="true" size={14} />
                </MobileActionButton>

                <MobileActionButton
                    label={isWatched ? `Remove ${player.viewName} from watchlist` : `Add ${player.viewName} to watchlist`}
                    active={isWatched}
                    disabled={watchlistUpdating}
                    onClick={onToggleWatch}
                >
                    <Eye aria-hidden="true" size={14} />
                </MobileActionButton>

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

                {onWaiverSelect && (
                    <MobileActionButton
                        label={canWaiver
                            ? `Add waiver for ${player.viewName}`
                            : `Waiver unavailable for ${player.viewName}`}
                        disabled={!canWaiver}
                        onClick={() => onWaiverSelect(player)}
                    >
                        {canWaiver
                            ? <ListPlus aria-hidden="true" size={14} />
                            : <LockKeyhole aria-hidden="true" size={14} />}
                    </MobileActionButton>
                )}
            </article>

            {showInfo && <PlayerInfoModal player={player} onClose={() => setShowInfo(false)} />}
        </>
    );
});

function MobileActionButton({ label, active = false, disabled = false, onClick, children }) {
    return (
        <button
            type="button"
            className={`mx-auto grid size-6 place-items-center rounded-md border transition ${active
                ? "border-app-accent bg-app-accent text-brand-ink ring-2 ring-app-accent/35 ring-offset-1 ring-offset-app-surface"
                : "border-app-border bg-app-surface-muted text-app-muted hover:border-app-accent-border hover:text-app-foreground"
            } disabled:cursor-not-allowed disabled:opacity-45`}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function getFixtureLabel(fixture) {
    const fixtures = getFixtureItems(fixture);
    return fixtures.length === 0 ? "-" : fixtures.map((item) => item.opponent).join(" • ");
}

export default MobilePlayerRow;
