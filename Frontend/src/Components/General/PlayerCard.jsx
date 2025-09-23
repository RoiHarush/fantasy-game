import PlayerKit from "./PlayerKit";
import Style from "../../Styles/PlayerCard.module.css";

function PlayerCard({ player, view, isSelected, isDisabled, onClick }) {
    const handleClick = () => {
        if (view === "pick") {
            if (!isDisabled) onClick?.(player.id);
        } else if (view === "points") {
            onClick?.(player);
        }
    };

    return (
        <div
            className={`${Style["player-card"]} 
                  ${isSelected ? Style["selected"] : ""} 
                  ${isDisabled ? Style["disabled"] : ""}`}
            onClick={handleClick}
        >
            <PlayerKit
                teamId={player.team}
                type={player.position === "GK" ? "gk" : "field"}
                className={Style["player-shirt"]}
            />

            <div className={Style["player-name"]}>
                {player.viewName}
            </div>

            {view === "pick" && (
                <div className={Style["player-nextMatch"]}>{player.nextMatch}</div>
            )}
            {view === "points" && (
                <div className={Style["player-points"]}>{player.points}</div>
            )}
        </div>
    );
}

export default PlayerCard;
