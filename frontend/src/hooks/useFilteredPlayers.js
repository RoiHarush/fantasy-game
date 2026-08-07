import { useMemo } from "react";
import { filterPlayers } from "../Utils/filterPlayers";
import { usePlayers } from "../features/players/usePlayers";
import { useWatchlist } from "../features/watchlist/useWatchlist";

export function useFilteredPlayers({
    activeButton,
    searchQuery,
    viewFilter,
    sortBy,
    showAvailable,
    irPosition
}) {
    const { players } = usePlayers();
    const { watchlist } = useWatchlist();


    const filteredPlayers = useMemo(() => {
        return filterPlayers({
            players,
            watchlist,
            activeButton,
            searchQuery,
            viewFilter,
            sortBy,
            showAvailable,
            irPosition
        });
    }, [
        players,
        watchlist,
        activeButton,
        searchQuery,
        viewFilter,
        sortBy,
        showAvailable,
        irPosition
    ]);

    return filteredPlayers;
}
