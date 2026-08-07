const DIACRITICS = /[\u0300-\u036f]/g;

export function normalizePlayerSearch(value) {
    return (value ?? "")
        .normalize("NFD")
        .replace(DIACRITICS, "")
        .replace(/[øØöÖœŒ]/g, "o")
        .replace(/[åÅäÄáÁàÀâÂ]/g, "a")
        .replace(/[éÉèÈêÊëË]/g, "e")
        .replace(/[íÍìÌîÎïÏ]/g, "i")
        .replace(/[úÚùÙûÛüÜ]/g, "u")
        .replace(/[ñÑ]/g, "n")
        .replace(/[łŁ]/g, "l")
        .toLowerCase();
}

export function findPlayers(players, searchTerm, options = {}) {
    if (searchTerm.trim().length < 2) return [];

    const normalizedTerm = normalizePlayerSearch(searchTerm);
    const availableOnly = Boolean(options.availableOnly);
    const limit = options.limit ?? 5;

    return players.filter((player) => {
        if (availableOnly && !player.available) return false;
        return [player.viewName, player.firstName, player.lastName]
            .some((name) => normalizePlayerSearch(name).includes(normalizedTerm));
    }).slice(0, limit);
}
