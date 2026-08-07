import React, { useMemo } from "react";
import { TableVirtuoso } from "react-virtuoso";
import Style from "../../../Styles/PlayerTable.module.css";
import PlayerRow from "./PlayerRow";
import { useGameweek } from "../../../Context/GameweeksContext";

function PlayerTable({
    players,
    user,
    mode = "scout",
    onPlayerSelect,
    currentTurnUserId,
    onCompare,
    comparePlayers,
    allTeamFixtures,
    disabledPlayerIds,
    onWaiverSelect,
    plannedIncomingIds
}) {
    const { currentGameweek, nextGameweek } = useGameweek();
    const currentGw = currentGameweek?.id ?? Math.max(0, (nextGameweek?.id ?? 1) - 1);
    const TableHead = React.forwardRef((props, ref) => (
        <thead {...props} ref={ref} style={{ background: '#fff', zIndex: 10 }} />
    ));
    TableHead.displayName = "TableHead";

    const upcomingGws = useMemo(() =>
        [currentGw + 1, currentGw + 2, currentGw + 3].filter((gw) => gw <= 38),
        [currentGw]);

    return (
        <div style={{ height: "calc(100vh - 280px)", width: "100%", background: "#fff" }}>
            <TableVirtuoso
                data={players}
                context={{ comparePlayers }}

                components={{
                    Table: ({ style, ...props }) => (
                        <table
                            {...props}
                            style={{ ...style, width: '100%', borderCollapse: 'collapse' }}
                            className={Style.mainTable}
                        />
                    ),
                    TableRow: (props) => {
                        const isSelected = props.context?.comparePlayers?.some(p => p.id === props.item.id);
                        return (
                            <tr
                                {...props}
                                className={isSelected ? Style.compareSelected : ""}
                            />
                        );
                    },
                    TableHead
                }}

                fixedHeaderContent={() => (
                    <tr className={Style.headerRow}>
                        <th style={{ width: '190px' }}>Player</th>
                        <th style={{ width: '46px' }}>Pts</th>

                        {upcomingGws.map((gw) => (
                            <th key={gw} style={{ width: '64px' }} className={Style.hiddenOnMobile}>
                                GW{gw}
                            </th>
                        ))}

                        <th style={{ width: '110px' }} className={Style.actionHeader}>
                            <span className={Style.desktopText}>Compare</span>
                            <span className={Style.mobileText}>CMP</span>
                        </th>

                        <th style={{ width: '92px' }} className={Style.actionHeader}>
                            <span className={Style.desktopText}>Watchlist</span>
                            <span className={Style.mobileText}>Watch</span>
                        </th>

                        {mode === "scout" && <th style={{ width: '86px' }} className={Style.actionHeader}>Owner</th>}
                        {mode === "scout" && onWaiverSelect && <th style={{ width: '82px' }} className={Style.actionHeader}>Waiver</th>}
                        {(mode === "transfer" || mode === "draft") && <th style={{ width: '80px' }} className={Style.actionHeader}>{mode === "draft" ? "Draft" : "Sign"}</th>}
                    </tr>
                )}

                itemContent={(index, player) => {
                    const teamFixtures = allTeamFixtures ? allTeamFixtures[player.teamId] : {};
                    return (
                        <PlayerRow
                            player={player}
                            user={user}
                            mode={mode}
                            currentTurnUserId={currentTurnUserId}
                            upcomingGws={upcomingGws}
                            onCompare={onCompare}
                            isSelectedForCompare={comparePlayers?.some(p => p.id === player.id)}
                            onPlayerSelect={onPlayerSelect}
                            teamFixtures={teamFixtures}
                            ruleLocked={disabledPlayerIds?.has(player.id)}
                            onWaiverSelect={onWaiverSelect}
                            waiverPlanned={plannedIncomingIds?.has(player.id)}
                        />
                    );
                }}
            />
        </div>
    );
}

PlayerTable.displayName = "PlayerTable";

export default PlayerTable;
