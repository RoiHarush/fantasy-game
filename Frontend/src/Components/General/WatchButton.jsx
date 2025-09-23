import { Eye, X } from "lucide-react";

function WatchButton({ playerId, user, setUser }) {
    const isWatched = user.watchedPlayers.includes(playerId);

    const toggleWatch = () => {
        setUser((prev) => {
            let updatedWatched;
            if (isWatched) {
                updatedWatched = prev.watchedPlayers.filter((id) => id !== playerId);
            } else {
                updatedWatched = [...prev.watchedPlayers, playerId];
            }
            return { ...prev, watchedPlayers: updatedWatched };
        });
    };

    return (
        <button onClick={toggleWatch}>
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

