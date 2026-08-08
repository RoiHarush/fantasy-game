import { useMemo } from "react";
import { filterPlayers } from "../Utils/filterPlayers";

export function useFilteredPlayers({
    players,
    watchlist,
    activeButton,
    searchQuery,
    viewFilter,
    sortBy,
    showAvailable,
    irPosition
}) {
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
