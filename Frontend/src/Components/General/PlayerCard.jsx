import PlayerKit from "./PlayerKit";
import Style from "../../Styles/PlayerCard.module.css";
import { usePlayerInteraction } from "../../Context/PlayerInteractionProvider";


function PlayerCard({
    player,
    view,
    captain = false,
    viceCaptain = false,
    points = null,
    nextFixture = null
}) {
    const { handlePlayerClick, selectedPlayerId, disabledIds } = usePlayerInteraction();

    if (!player) {
        return (
            <div className={`${Style["player-card"]} ${Style["empty-card"]}`}>
                <PlayerKit teamId={0} type="" className={Style["player-shirt"]} />
            </div>
        );
    }

    const isSelected = view === "pick" && selectedPlayerId === player.id;
    const isDisabled = view === "pick" && disabledIds.includes(player.id);

    const handleClick = () => {
        if (isDisabled) return;
        handlePlayerClick(player.id);
    };

    let injuryColor = null;
    if (player.chanceOfPlayingNextRound !== null && player.chanceOfPlayingNextRound < 100) {
        const c = player.chanceOfPlayingNextRound;
        if (c === 0) injuryColor = "#d81919";
        else if (c <= 25) injuryColor = "#ff3b1f";
        else if (c <= 50) injuryColor = "#ff6b4a";
        else if (c <= 75) injuryColor = "#ff8c80";
    }

    const hasPoints = points !== null && points !== undefined;
    const shownValue = hasPoints ? (captain ? points * 2 : points) : (nextFixture ?? "-");
    const shownClass =
        view === "pick"
            ? Style["player-nextMatch"]
            : Style["player-points"];

    return (
        <div
            className={`${Style["player-card"]} 
                ${isSelected ? Style["selected"] : ""} 
                ${isDisabled ? Style["disabled"] : ""}`}
            onClick={handleClick}
        >
            {(player.injured || injuryColor) && (
                <div className={Style["injury-icon"]} style={{ backgroundColor: injuryColor || "#d81919" }}>
                    !
                </div>
            )}

            {(captain || viceCaptain) && (
                <div className={Style["captain-badge-container"]}>
                    {captain && <div className={Style["captain-badge"]}>C</div>}
                    {viceCaptain && !captain && <div className={Style["vice-badge"]}>V</div>}
                </div>
            )}

            <PlayerKit
                teamId={player.teamId}
                type={player.position === "GK" ? "gk" : "field"}
                className={Style["player-shirt"]}
            />

            <div
                className={Style["player-name"]}
                style={injuryColor ? { backgroundColor: injuryColor } : {}}
            >
                {player.viewName}
            </div>

            <div className={shownClass}>{shownValue}</div>
        </div>
    );
}

export default PlayerCard;
