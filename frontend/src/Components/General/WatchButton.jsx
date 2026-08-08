import { Eye } from "lucide-react";
import Style from "../../Styles/WatchButton.module.css";

function WatchButton({ isWatched, onToggle, disabled = false }) {
    const handleClick = (e) => {
        e.stopPropagation();
        onToggle();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className={`${Style.watchBtn} ${isWatched ? Style.watched : Style.notWatched}`}
            title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
        >
            {isWatched ? (
                <>
                    <Eye className={Style.icon} strokeWidth={2.5} />
                    <span className={Style.btnText}>Watch</span>
                </>
            ) : (
                <>
                    <Eye className={Style.icon} strokeWidth={1.5} />
                    <span className={Style.btnText}>Watch</span>
                </>
            )}
        </button>
    );
}

export default WatchButton;

