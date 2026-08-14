"use client";

import { forwardRef, useMemo } from "react";
import { TableVirtuoso, Virtuoso } from "react-virtuoso";

import { useGameweek } from "../../../features/gameweeks/useGameweek";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import MobilePlayerRow, { getMobilePlayerColumns } from "./MobilePlayerRow";
import PlayerRow from "./PlayerRow";

const VirtuosoTable = forwardRef(function VirtuosoTable({ style, ...props }, ref) {
    return (
        <table
            {...props}
            ref={ref}
            style={{ ...style, width: "100%", maxWidth: "100%", tableLayout: "fixed" }}
            className="w-full table-fixed border-collapse text-sm text-app-foreground"
        />
    );
});

const VirtuosoTableHead = forwardRef(function VirtuosoTableHead(props, ref) {
    return <thead {...props} ref={ref} className="z-30 bg-app-surface-muted" />;
});

function VirtuosoTableRow({ context, item, ...rowProps }) {
    const isSelected = context?.comparePlayers?.some(
        (player) => String(player.id) === String(item.id),
    );
    return (
        <tr
            {...rowProps}
            className={`h-16 border-b border-app-border bg-app-surface transition-colors hover:bg-app-accent-hover ${isSelected ? "bg-app-accent-surface" : ""}`}
        />
    );
}

const VIRTUOSO_COMPONENTS = {
    Table: VirtuosoTable,
    TableRow: VirtuosoTableRow,
    TableHead: VirtuosoTableHead,
};

function PlayerTable({
    players,
    teams,
    user,
    mode = "scout",
    onPlayerSelect,
    currentTurnUserId,
    onCompare,
    comparePlayers,
    allTeamFixtures,
    disabledPlayerIds,
    watchedPlayerIds,
    onToggleWatch,
    watchlistUpdatingPlayerId,
    onWaiverSelect,
}) {
    const isMobile = useMediaQuery("(max-width: 767px)");
    const { currentGameweek, nextGameweek, lastGameweek } = useGameweek();
    const currentGameweekId = currentGameweek?.id
        ?? lastGameweek?.id
        ?? Math.max(0, (nextGameweek?.id ?? 1) - 1);
    const upcomingGameweeks = useMemo(
        () => [currentGameweekId + 1, currentGameweekId + 2, currentGameweekId + 3]
            .filter((gameweek) => gameweek <= 38),
        [currentGameweekId],
    );
    const teamsById = useMemo(
        () => new Map(teams.map((team) => [String(team.id), team])),
        [teams],
    );

    if (isMobile) {
        const hasWaiverAction = Boolean(onWaiverSelect);
        return (
            <div className="min-h-[32rem] w-full max-w-full overflow-hidden bg-app-surface">
                <div
                    className="grid items-center gap-x-1 border-b-2 border-app-border bg-app-surface-muted px-2 py-1.5 text-[0.52rem] font-extrabold uppercase tracking-wide text-app-muted"
                    style={{ gridTemplateColumns: getMobilePlayerColumns(mode, hasWaiverAction) }}
                >
                    <span>Player</span>
                    <span className="text-center">Pts</span>
                    <span className="text-center">GW{upcomingGameweeks[0] ?? "-"}</span>
                    <span className="text-center">Cmp</span>
                    <span className="text-center">Watch</span>
                    <span className="text-center">{mode === "scout" ? "Owner" : mode === "draft" ? "Pick" : "Sign"}</span>
                    {hasWaiverAction && <span className="text-center">Wvr</span>}
                </div>
                <Virtuoso
                    style={{
                        height: "clamp(32rem, 68dvh, 48rem)",
                        minHeight: "32rem",
                        maxWidth: "100%",
                        overflowX: "hidden",
                        overscrollBehaviorX: "none",
                        touchAction: "pan-y",
                    }}
                    data={players}
                    itemContent={(_index, player) => (
                        <MobilePlayerRow
                            player={player}
                            team={teamsById.get(String(player.teamId))}
                            user={user}
                            mode={mode}
                            currentTurnUserId={currentTurnUserId}
                            nextGameweek={upcomingGameweeks[0]}
                            onCompare={onCompare}
                            isSelectedForCompare={comparePlayers?.some((item) => String(item.id) === String(player.id))}
                            onPlayerSelect={onPlayerSelect}
                            teamFixtures={allTeamFixtures?.[player.teamId] ?? {}}
                            ruleLocked={disabledPlayerIds?.has(player.id)}
                            isWatched={watchedPlayerIds?.has(String(player.id))}
                            onToggleWatch={() => onToggleWatch(player.id)}
                            watchlistUpdating={String(watchlistUpdatingPlayerId) === String(player.id)}
                            onWaiverSelect={onWaiverSelect}
                        />
                    )}
                />
            </div>
        );
    }

    return (
        <div className="min-h-[32rem] w-full overflow-hidden bg-app-surface">
            <TableVirtuoso
                style={{
                    height: "clamp(32rem, 68dvh, 48rem)",
                    minHeight: "32rem",
                    maxWidth: "100%",
                    overflowX: "hidden",
                    overscrollBehaviorX: "none",
                    touchAction: "pan-y",
                }}
                data={players}
                context={{ comparePlayers }}
                components={VIRTUOSO_COMPONENTS}
                fixedHeaderContent={() => (
                    <tr className="border-b-2 border-app-border bg-app-surface-muted text-[0.68rem] font-extrabold uppercase tracking-wide text-app-muted sm:text-xs">
                        <th scope="col" className="w-[32%] px-1.5 py-3 text-left sm:px-3 md:w-[25%]">Player</th>
                        <th scope="col" className="w-[7%] px-0.5 py-3 text-center md:w-[5%]">Pts</th>

                        {upcomingGameweeks.map((gameweek) => (
                            <th key={gameweek} scope="col" className="w-[6%] px-1 py-3 text-center">
                                GW{gameweek}
                            </th>
                        ))}

                        <th scope="col" className="w-[10%] px-0.5 py-3 text-center md:w-[11%] md:px-1">
                            <span className="hidden xl:inline">Compare</span>
                            <span className="xl:hidden">CMP</span>
                        </th>

                        <th scope="col" className="w-[10%] px-0.5 py-3 text-center md:w-[10%] md:px-1">
                            <span className="hidden xl:inline">Watchlist</span>
                            <span className="xl:hidden">Watch</span>
                        </th>

                        {mode === "scout" && <th scope="col" className="w-[12%] px-0.5 py-3 text-center md:w-[8%] md:px-1">Owner</th>}
                        {mode === "scout" && onWaiverSelect && <th scope="col" className="w-[17%] px-1 py-3 text-center md:w-[10%]">Waiver</th>}
                        {(mode === "transfer" || mode === "draft") && (
                            <th scope="col" className="w-[17%] px-1 py-3 text-center md:w-[10%]">
                                {mode === "draft" ? "Draft" : "Sign"}
                            </th>
                        )}
                    </tr>
                )}
                itemContent={(_index, player) => (
                    <PlayerRow
                        player={player}
                        team={teamsById.get(String(player.teamId))}
                        user={user}
                        mode={mode}
                        currentTurnUserId={currentTurnUserId}
                        upcomingGws={upcomingGameweeks}
                        onCompare={onCompare}
                        isSelectedForCompare={comparePlayers?.some((item) => String(item.id) === String(player.id))}
                        onPlayerSelect={onPlayerSelect}
                        teamFixtures={allTeamFixtures?.[player.teamId] ?? {}}
                        ruleLocked={disabledPlayerIds?.has(player.id)}
                        isWatched={watchedPlayerIds?.has(String(player.id))}
                        onToggleWatch={() => onToggleWatch(player.id)}
                        watchlistUpdating={String(watchlistUpdatingPlayerId) === String(player.id)}
                        onWaiverSelect={onWaiverSelect}
                    />
                )}
            />
        </div>
    );
}

export default PlayerTable;
