import React, { useState, memo } from "react";
import WatchButton from "../../General/WatchButton";
import PlayerKit from "../../General/PlayerKit";
import Style from "../../../Styles/PlayerRow.module.css";
import PlayerInfoModal from "../../General/PlayerInfoModal";
import TeamShortNames from "../../../Utils/teamNameMap";
import Portal from "../../../Portal";
import { ArrowRightLeft } from "lucide-react";
import { useTeams } from "../../../Context/TeamsContext";

const PlayerRow = memo(function PlayerRow({
    player,
    user,
    mode,
    currentTurnUserId,
    upcomingGws,
    onCompare,
    isSelectedForCompare,
    onPlayerSelect,
    teamFixtures
}) {
    const { teams } = useTeams();
    const [showInfo, setShowInfo] = useState(false);

    const isMyTurn = currentTurnUserId === user?.id;
    const team = teams.find(t => t.id === player.teamId);
    const teamName = team ? team.shortName : "";

    let injuryColor = null;
    if (player.chanceOfPlayingNextRound !== null && player.chanceOfPlayingNextRound < 100) {
        const c = player.chanceOfPlayingNextRound;
        if (c === 0) injuryColor = "#d81919";
        else if (c <= 25) injuryColor = "#ff3b1f";
        else if (c <= 50) injuryColor = "#ff6b4a";
        else if (c <= 75) injuryColor = "#ff8c80";
    }

    const ownerLabel = player.available
        ? "Free"
        : player.ownerId === user?.id
            ? "You"
            : player.ownerName || "Unknown";

    return (
        <>
            <td className={Style.playerMainCell}>
                <div className={Style.playerCell}>
                    <div className={Style.infoIconWrapper} onClick={(e) => { e.stopPropagation(); setShowInfo(true); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={Style.infoIcon}>
                            <circle cx="12" cy="12" r="10" fill={injuryColor || "#888"} />
                            <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">i</text>
                        </svg>
                    </div>
                    <PlayerKit teamId={player.teamId} type={player.position === "GK" ? "gk" : "field"} className={Style.playerShirt} />
                    <div className={Style.playerInfo}>
                        <span className={Style.playerName}>{player.viewName}</span>
                        <span className={Style.playerSubinfo}>{teamName} • {player.position}</span>
                    </div>
                </div>
            </td>

            <td>{player.points}</td>

            {upcomingGws.map((gw) => {
                const fixture = teamFixtures?.[String(gw)];
                if (!fixture) return <td key={gw}>-</td>;

                const match = fixture.opponent.match(/^(.*)\s\((H|A)\)$/);
                const fullName = match ? match[1].trim() : fixture.opponent;
                const ha = match ? match[2] : "";
                const shortName = TeamShortNames[fullName] || fullName;

                return (
                    <td key={gw} className={Style.fixtureCell}>
                        {shortName} ({ha})
                    </td>
                );
            })}

            <td>
                <button
                    className={`${Style.compareBtn} ${isSelectedForCompare ? Style.selectedCompare : ""}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        !isSelectedForCompare && onCompare?.(player);
                    }}
                    disabled={isSelectedForCompare}
                >
                    <ArrowRightLeft size={16} className={Style.compareIcon} />
                    <span className={Style.compareText}>
                        {isSelectedForCompare ? "Selected" : "Compare"}
                    </span>
                </button>
            </td>

            <td><WatchButton playerId={player.id} /></td>

            {mode === "scout" && (
                <td>
                    <span className={`${Style.ownerBadge} ${player.available ? Style.ownerFree : player.ownerId === user.id ? Style.ownerMe : ""}`}>
                        {ownerLabel}
                    </span>
                </td>
            )}

            {mode === "transfer" && (
                <td>
                    {player.available ? (
                        <button
                            className={Style.signBtn}
                            disabled={!isMyTurn}
                            onClick={(e) => {
                                e.stopPropagation();
                                isMyTurn && onPlayerSelect?.(player);
                            }}
                        >
                            {isMyTurn ? "Sign" : "Wait"}
                        </button>
                    ) : (
                        <img src="/Icons/lock.svg" alt="Locked" className={Style.lockIcon} />
                    )}
                </td>
            )}

            {showInfo && (
                <Portal>
                    <PlayerInfoModal player={player} onClose={() => setShowInfo(false)} />
                </Portal>
            )}
        </>
    );
});

export default PlayerRow;