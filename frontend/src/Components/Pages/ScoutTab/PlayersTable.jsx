"use client";

import { forwardRef, useMemo } from "react";
import { TableVirtuoso } from "react-virtuoso";

import { useGameweek } from "../../../features/gameweeks/useGameweek";
import styles from "../../../Styles/PlayerTable.module.css";
import PlayerRow from "./PlayerRow";

const VirtuosoTable = forwardRef(function VirtuosoTable({ style, ...props }, ref) {
    return (
        <table
            {...props}
            ref={ref}
            style={{ ...style, width: "100%", borderCollapse: "collapse" }}
            className={styles.mainTable}
        />
    );
});

const VirtuosoTableHead = forwardRef(function VirtuosoTableHead(props, ref) {
    return <thead {...props} ref={ref} style={{ background: "#fff", zIndex: 10 }} />;
});

function VirtuosoTableRow({ context, item, ...rowProps }) {
    const isSelected = context?.comparePlayers?.some(
        (player) => String(player.id) === String(item.id),
    );
    return <tr {...rowProps} className={isSelected ? styles.compareSelected : ""} />;
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
    watchlistUpdating,
    onWaiverSelect,
    plannedIncomingIds,
}) {
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

    return (
        <div style={{ height: "calc(100vh - 280px)", width: "100%", background: "#fff" }}>
            <TableVirtuoso
                data={players}
                context={{ comparePlayers }}
                components={VIRTUOSO_COMPONENTS}
                fixedHeaderContent={() => (
                    <tr className={styles.headerRow}>
                        <th scope="col" style={{ width: "190px" }}>Player</th>
                        <th scope="col" style={{ width: "46px" }}>Pts</th>

                        {upcomingGameweeks.map((gameweek) => (
                            <th key={gameweek} scope="col" style={{ width: "64px" }} className={styles.hiddenOnMobile}>
                                GW{gameweek}
                            </th>
                        ))}

                        <th scope="col" style={{ width: "110px" }} className={styles.actionHeader}>
                            <span className={styles.desktopText}>Compare</span>
                            <span className={styles.mobileText}>CMP</span>
                        </th>

                        <th scope="col" style={{ width: "92px" }} className={styles.actionHeader}>
                            <span className={styles.desktopText}>Watchlist</span>
                            <span className={styles.mobileText}>Watch</span>
                        </th>

                        {mode === "scout" && <th scope="col" style={{ width: "86px" }} className={styles.actionHeader}>Owner</th>}
                        {mode === "scout" && onWaiverSelect && <th scope="col" style={{ width: "82px" }} className={styles.actionHeader}>Waiver</th>}
                        {(mode === "transfer" || mode === "draft") && (
                            <th scope="col" style={{ width: "80px" }} className={styles.actionHeader}>
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
                        watchlistUpdating={watchlistUpdating}
                        onWaiverSelect={onWaiverSelect}
                        waiverPlanned={plannedIncomingIds?.has(player.id)}
                    />
                )}
            />
        </div>
    );
}

export default PlayerTable;
