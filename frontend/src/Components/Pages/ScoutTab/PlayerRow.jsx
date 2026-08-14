import { Compare, Info, LockKeyhole, WaiverAdd } from "@/src/shared/ui/icons";
import { memo, useState } from "react";

import { getInitials } from "../../../lib/initials";
import { getPlayerInjuryColor } from "../../../lib/playerStatus";
import { getFixtureItems } from "../../../features/fixtures/model";
import { getPlayerAcquisitionLockReason } from "../../../features/transfer-window/model";
import PlayerInfoModal from "../../General/PlayerInfoModal";
import PlayerKit from "../../General/PlayerKit";
import NewPlayerLabel from "./NewPlayerLabel";
import WatchButton from "../../General/WatchButton";
import { Button } from "../../../shared/ui/Button";

const PlayerRow = memo(function PlayerRow({
    player,
    team,
    user,
    mode,
    currentTurnUserId,
    upcomingGws,
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
    const isMyTurn = String(currentTurnUserId) === String(user?.id);
    const teamName = team?.shortName ?? "";
    const injuryColor = getPlayerInjuryColor(player.chanceOfPlayingNextRound);
    const ownerName = player.available
        ? "Free agent"
        : String(player.ownerId) === String(user?.id)
            ? user?.name || player.ownerName || "You"
            : player.ownerName || "Unknown manager";
    const ownerInitials = getInitials(ownerName);
    const acquisitionLockReason = getPlayerAcquisitionLockReason(player, { ruleLocked });

    return (
        <>
            <td className="min-w-0 px-1.5 py-2 sm:px-3">
                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="grid size-4 shrink-0 place-items-center p-0 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                        aria-label={`View ${player.viewName} information`}
                        style={{ color: injuryColor || "var(--app-muted)" }}
                        onClick={(event) => {
                            event.stopPropagation();
                            setShowInfo(true);
                        }}
                    >
                        <Info aria-hidden="true" size={14} strokeWidth={2.2} />
                    </Button>
                    <PlayerKit
                        teamId={player.teamId}
                        type={player.position === "GK" ? "gk" : "field"}
                        className="block h-7 max-h-7 w-7 max-w-7 shrink-0 object-contain"
                        style={{ width: "1.75rem", height: "1.75rem" }}
                    />
                    <div className="min-w-0 leading-tight">
                        <span className="flex min-w-0 items-center gap-1">
                            <span className="block min-w-0 truncate text-xs font-bold text-app-foreground sm:text-sm">{player.viewName}</span>
                            {player.supplementalDraftEligible && <NewPlayerLabel />}
                        </span>
                        <span className="block truncate text-[0.64rem] font-medium text-app-muted sm:text-[0.7rem]">
                            {teamName} • {player.position}
                        </span>
                    </div>
                </div>
            </td>

            <td className="px-1 py-2 text-center font-bold text-app-foreground">{player.points}</td>

            {upcomingGws.map((gameweek) => {
                const fixtures = getFixtureItems(teamFixtures?.[String(gameweek)]);
                if (fixtures.length === 0) {
                    return <td key={gameweek} className="px-1 py-2 text-center text-xs font-semibold text-app-muted">-</td>;
                }

                const label = fixtures.map((fixture) => fixture.opponent).join(" • ");

                return (
                    <td key={gameweek} className="truncate px-1 py-2 text-center text-[0.7rem] font-semibold text-app-muted" title={label}>
                        {label}
                    </td>
                );
            })}

            <td className="px-1 py-2 text-center">
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className={`mx-auto inline-flex size-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-app-accent xl:h-9 xl:w-auto xl:px-2.5 ${isSelectedForCompare
                        ? "border-app-accent bg-app-accent text-brand-ink ring-2 ring-app-accent/35 ring-offset-1 ring-offset-app-surface"
                        : "border-app-border bg-app-surface-muted text-app-foreground hover:border-app-accent-border hover:bg-app-accent-hover"
                    }`}
                    onClick={(event) => {
                        event.stopPropagation();
                        if (!isSelectedForCompare) onCompare?.(player);
                    }}
                    disabled={isSelectedForCompare}
                >
                    <Compare aria-hidden="true" size={17} />
                    <span className="hidden xl:inline">{isSelectedForCompare ? "Selected" : "Compare"}</span>
                </Button>
            </td>

            <td className="px-1 py-2 text-center">
                <WatchButton
                    isWatched={isWatched}
                    onToggle={onToggleWatch}
                    disabled={watchlistUpdating}
                />
            </td>

            {mode === "scout" && (
                <td className="px-1 py-2 text-center">
                    {player.supplementalDraftEligible ? (
                        <NewPlayerLabel className="mx-auto justify-center" />
                    ) : player.available ? (
                        <span
                            title="Free agent"
                            aria-label="Owner: Free agent"
                            className="mx-auto inline-flex h-7 items-center justify-center rounded-full border border-app-border bg-app-surface-muted px-1.5 text-[0.6rem] font-extrabold uppercase tracking-wide text-app-muted"
                        >
                            Free
                        </span>
                    ) : (
                        <span
                            title={ownerName}
                            aria-label={`Owner: ${ownerName}`}
                            className={`mx-auto grid size-8 place-items-center rounded-full border text-[0.66rem] font-extrabold tracking-wide ${String(player.ownerId) === String(user?.id)
                                ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                                : "border-app-accent-border bg-app-accent-surface text-app-accent-foreground"
                            }`}
                        >
                            {ownerInitials}
                        </span>
                    )}
                </td>
            )}

            {mode === "scout" && onWaiverSelect && (
                <td className="px-1 py-2 text-center">
                    {player.available || (player.ownerId != null && String(player.ownerId) !== String(user?.id)) ? (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="mx-auto inline-flex h-9 min-w-0 items-center justify-center gap-1 rounded-lg border border-app-accent-border bg-app-accent-surface px-2 text-xs font-bold text-app-accent-foreground transition hover:border-app-accent hover:bg-app-accent-hover focus-visible:outline-2 focus-visible:outline-app-accent"
                            onClick={(event) => {
                                event.stopPropagation();
                                onWaiverSelect(player);
                            }}
                        >
                            <WaiverAdd aria-hidden="true" size={16} />
                            <span className="hidden xl:inline">Waiver</span>
                        </Button>
                    ) : (
                        <LockKeyhole
                            aria-label={`Unavailable: ${acquisitionLockReason || "This player is already in your squad"}`}
                            title={acquisitionLockReason || "This player is already in your squad"}
                            className="mx-auto size-5 text-app-muted"
                        />
                    )}
                </td>
            )}

            {(mode === "transfer" || mode === "draft") && (
                <td className="px-1 py-2 text-center">
                    {!acquisitionLockReason ? (
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="mx-auto inline-flex h-9 min-w-0 items-center justify-center rounded-lg bg-component-gradient px-2.5 text-xs font-extrabold text-brand-ink transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                            disabled={!isMyTurn}
                            onClick={(event) => {
                                event.stopPropagation();
                                if (isMyTurn) onPlayerSelect?.(player);
                            }}
                        >
                            {isMyTurn ? (mode === "draft" ? "Pick" : "Sign") : "Wait"}
                        </Button>
                    ) : (
                        <LockKeyhole
                            aria-label={`Locked: ${acquisitionLockReason}`}
                            title={acquisitionLockReason}
                            className="mx-auto size-5 text-app-muted"
                        />
                    )}
                </td>
            )}

            {showInfo && <PlayerInfoModal player={player} onClose={() => setShowInfo(false)} />}
        </>
    );
});

export default PlayerRow;
