import { useRef, useState, useEffect } from "react";
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
}) {
    const { currentGameweek } = useGameweek();
    const currentGw = currentGameweek?.id ?? 1;
    const upcomingGws = [currentGw + 1, currentGw + 2, currentGw + 3].filter((gw) => gw <= 38);

    const rowHeight = 64;
    const buffer = 10;
    const containerRef = useRef(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => setScrollTop(container.scrollTop);
        container.addEventListener("scroll", handleScroll);

        setVisibleCount(Math.ceil(container.clientHeight / rowHeight));

        return () => {
            if (container) {
                container.removeEventListener("scroll", handleScroll);
            }
        };
    }, []);


    const totalHeight = players.length * rowHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
    const endIndex = Math.min(players.length, startIndex + visibleCount + buffer * 2);
    const visiblePlayers = players.slice(startIndex, endIndex);

    const topSpacerHeight = startIndex * rowHeight;
    const bottomSpacerHeight = totalHeight - (endIndex * rowHeight);

    return (
        <div className={Style.tableContainer} ref={containerRef}>
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Pts</th>
                        {upcomingGws.map((gw) => (
                            <th key={gw}>GW{gw}</th>
                        ))}
                        <th>Compare</th>
                        <th>Watchlist</th>
                        {mode === "scout" && <th>Owner</th>}
                        {mode === "transfer" && <th>Sign</th>}
                    </tr>
                </thead>

                <tbody>
                    {topSpacerHeight > 0 && (
                        <tr style={{ height: `${topSpacerHeight}px` }}>
                            <td colSpan="10"></td>
                        </tr>
                    )}

                    {visiblePlayers.map((player) => (
                        <PlayerRow
                            key={player.id}
                            player={player}
                            user={user}
                            mode={mode}
                            currentTurnUserId={currentTurnUserId}
                            upcomingGws={upcomingGws}
                            onCompare={onCompare}
                            comparePlayers={comparePlayers}
                            onPlayerSelect={onPlayerSelect}
                        />
                    ))}

                    {bottomSpacerHeight > 0 && (
                        <tr style={{ height: `${bottomSpacerHeight}px` }}>
                            <td colSpan="10"></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default PlayerTable;
