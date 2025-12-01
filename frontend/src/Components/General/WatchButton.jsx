import { Eye, EyeOff } from "lucide-react";
import { useWatchlist } from "../../Context/WatchlistContext";
import Style from "../../Styles/WatchButton.module.css";

function WatchButton({ playerId }) {
    const { watchlist, toggleWatch } = useWatchlist();
    const isWatched = Array.isArray(watchlist) && watchlist.includes(playerId);

    const handleClick = (e) => {
        e.stopPropagation();
        toggleWatch(playerId, isWatched);
    };

    return (
        <button
            onClick={handleClick}
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

