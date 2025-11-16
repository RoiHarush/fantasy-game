export function filterPlayers({
    players,
    watchlist = [],
    activeButton = "All players",
    searchQuery = "",
    viewFilter = "All",
    sortBy = "Points",
    showAvailable = false,
    irPosition = null
}) {
    if (!Array.isArray(players)) return [];

    let result = [...players];

    if (activeButton === "Watchlist") result = result.filter(p => watchlist.includes(p.id));

    const normalize = (str) =>
        (str || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[øØöÖœŒ]/g, "o")
            .replace(/[åÅäÄáÁàÀâÂ]/g, "a")
            .replace(/[éÉèÈêÊëË]/g, "e")
            .replace(/[íÍìÌîÎïÏ]/g, "i")
            .replace(/[úÚùÙûÛüÜ]/g, "u")
            .replace(/[ñÑ]/g, "n")
            .replace(/[łŁ]/g, "l")
            .toLowerCase();

    const normalizedSearch = normalize(searchQuery);
    if (normalizedSearch) {
        result = result.filter((p) => {
            const words = normalize(p.viewName).split(/[.\s_\']+/);
            return words.some((w) => w.startsWith(normalizedSearch));
        });
    }

    if (irPosition) {
        const positionMap = {
            goalkeeper: "GK",
            gk: "GK",
            defender: "DEF",
            def: "DEF",
            midfielder: "MID",
            mid: "MID",
            forward: "FWD",
            fwd: "FWD",
        };
        const shortPos = positionMap[irPosition.toLowerCase()] || irPosition;
        result = result.filter((p) => p.position === shortPos);
    } else if (viewFilter !== "All") {
        if (["GK", "DEF", "MID", "FWD"].includes(viewFilter)) {
            result = result.filter((p) => p.position === viewFilter);
        } else if (viewFilter.startsWith("Team")) {
            const teamNumber = parseInt(viewFilter.replace("Team", ""), 10);
            result = result.filter((p) => p.teamId === teamNumber);
        }
    }

    if (showAvailable) {
        result = result.filter((p) => p.available);
    }

    if (sortBy === "Points") {
        result.sort((a, b) => b.points - a.points);
    } else if (sortBy === "Name") {
        result.sort((a, b) => a.viewName.localeCompare(b.viewName));
    }

    return result;
}
