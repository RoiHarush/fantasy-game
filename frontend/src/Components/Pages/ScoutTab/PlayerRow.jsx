import { ArrowRightLeft } from "lucide-react";
import Image from "next/image";
import { memo, useState } from "react";

import styles from "../../../Styles/PlayerRow.module.css";
import TeamShortNames from "../../../Utils/teamNameMap";
import WatchButton from "../../General/WatchButton";
import PlayerKit from "../../General/PlayerKit";
import PlayerInfoModal from "../../General/PlayerInfoModal";

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
    waiverPlanned = false
}) {
    const [showInfo, setShowInfo] = useState(false);

    const isMyTurn = String(currentTurnUserId) === String(user?.id);
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
        : String(player.ownerId) === String(user?.id)
            ? "You"
            : player.ownerName || "Unknown";

    return (
        <>
            <td className={styles.playerMainCell}>
                <div className={styles.playerCell}>
                    <button
                        type="button"
                        className={styles.infoIconWrapper}
                        aria-label={`View ${player.viewName} information`}
                        onClick={(event) => {
                            event.stopPropagation();
                            setShowInfo(true);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={styles.infoIcon} aria-hidden="true">
                            <circle cx="12" cy="12" r="10" fill={injuryColor || "#888"} />
                            <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">i</text>
                        </svg>
                    </button>
                    <PlayerKit teamId={player.teamId} type={player.position === "GK" ? "gk" : "field"} className={styles.playerShirt} />
                    <div className={styles.playerInfo}>
                        <span className={styles.playerName}>{player.viewName}</span>
                        <span className={styles.playerSubinfo}>{teamName} • {player.position}</span>
                    </div>
                </div>
            </td>

            <td>{player.points}</td>

            {upcomingGws.map((gw) => {
                const fixture = teamFixtures?.[String(gw)];
                if (!fixture) return <td key={gw} className={styles.fixtureCell}>-</td>;

                const match = fixture.opponent.match(/^(.*)\s\((H|A)\)$/);
                const fullName = match ? match[1].trim() : fixture.opponent;
                const ha = match ? match[2] : "";
                const shortName = TeamShortNames[fullName] || fullName;

                return (
                    <td key={gw} className={styles.fixtureCell}>
                        {shortName} ({ha})
                    </td>
                );
            })}

            <td className={styles.actionCell}>
                <button
                    type="button"
                    className={`${styles.compareBtn} ${isSelectedForCompare ? styles.selectedCompare : ""}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        !isSelectedForCompare && onCompare?.(player);
                    }}
                    disabled={isSelectedForCompare}
                >
                    <ArrowRightLeft size={18} className={styles.compareIcon} />
                    <span className={styles.compareText}>
                        {isSelectedForCompare ? "Selected" : "Compare"}
                    </span>
                </button>
            </td>

            <td className={styles.squareBtnCell}>
                <div className={styles.watchWrapper}>
                    <WatchButton isWatched={isWatched} onToggle={onToggleWatch} disabled={watchlistUpdating} />
                </div>
            </td>

            {mode === "scout" && (
                <td className={styles.actionCell}>
                    <span
                        className={`${styles.ownerBadge} ${player.available
                            ? styles.ownerFree
                            : String(player.ownerId) === String(user?.id)
                                ? styles.ownerMe
                                : styles.ownerOther
                            }`}
                    >
                        {ownerLabel}
                    </span>
                </td >
            )}

            {mode === "scout" && onWaiverSelect && (
                <td className={styles.actionCell}>
                    {player.available || (player.ownerId != null && String(player.ownerId) !== String(user?.id)) ? (
                        <button
                            type="button"
                            className={styles.waiverBtn}
                            onClick={event => {
                                event.stopPropagation();
                                onWaiverSelect(player);
                            }}
                        >{waiverPlanned ? "Planned" : "Waiver"}</button>
                    ) : (
                        <Image
                            src="/Icons/lock.svg"
                            alt="Unavailable"
                            title={String(player.ownerId) === String(user?.id)
                                ? "This player is already in your squad"
                                : "This player is locked by the league manager"}
                            width={24}
                            height={24}
                            className={styles.lockIcon}
                        />
                    )}
                </td>
            )}

            {
                (mode === "transfer" || mode === "draft") && (
                    <td className={styles.actionCell}>
                        {player.available && !ruleLocked ? (
                            <button
                                type="button"
                                className={styles.signBtn}
                                disabled={!isMyTurn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    isMyTurn && onPlayerSelect?.(player);
                                }}
                            >
                                {isMyTurn ? (mode === "draft" ? "Pick" : "Sign") : "Wait"}
                            </button>
                        ) : (
                            <Image
                                src="/Icons/lock.svg"
                                alt="Locked"
                                title={ruleLocked ? "This pick would exceed a squad position or three-player club limit" : "Player is unavailable"}
                                width={24}
                                height={24}
                                className={styles.lockIcon}
                            />
                        )}
                    </td>
                )
            }

            {
                showInfo && (
                    <PlayerInfoModal player={player} onClose={() => setShowInfo(false)} />
                )
            }
        </>
    );
});

export default PlayerRow;
