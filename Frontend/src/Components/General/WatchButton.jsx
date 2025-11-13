import { Eye, X } from "lucide-react";
import { useWatchlist } from "../../Context/WatchlistContext";

function WatchButton({ playerId }) {
    const { watchlist, toggleWatch } = useWatchlist();
    const isWatched = Array.isArray(watchlist) && watchlist.includes(playerId);

    const handleClick = () => {
        toggleWatch(playerId, isWatched);
    };

    return (
        <button onClick={handleClick}>
            {isWatched ? (
                <>
                    <X size={14} /> Remove
                </>
            ) : (
                <>
                    <Eye size={14} /> Watch
                </>
            )}
        </button>
    );
}

export default WatchButton;

