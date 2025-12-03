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
    allTeamFixtures
}) {
    const { currentGameweek } = useGameweek();
    const currentGw = currentGameweek?.id ?? 1;

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
                    TableHead: React.forwardRef((props, ref) => (
                        <thead {...props} ref={ref} style={{ background: '#fff', zIndex: 10 }} />
                    ))
                }}

                fixedHeaderContent={() => (
                    <tr className={Style.headerRow}>
                        <th style={{ width: '250px' }}>Player</th>
                        <th style={{ width: '50px' }}>Pts</th>
                        {upcomingGws.map((gw) => (
                            <th key={gw} style={{ width: '80px' }}>GW{gw}</th>
                        ))}
                        <th style={{ width: '100px' }}>Compare</th>
                        <th style={{ width: '60px' }}>Watchlist</th>
                        {mode === "scout" && <th style={{ width: '100px' }}>Owner</th>}
                        {mode === "transfer" && <th style={{ width: '80px' }}>Sign</th>}
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
                        />
                    );
                }}
            />
        </div>
    );
}

export default PlayerTable;