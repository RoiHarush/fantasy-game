function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function getStatLine(stats, name) {
    return stats?.find((stat) => stat.name === name) ?? null;
}

export function getStatValue(stats, name) {
    return toNumber(getStatLine(stats, name)?.value);
}

export function buildPlayerStatRow(match, teamFixtures = {}) {
    const stats = match.stats ?? [];
    const gameweek = match.gameweekId;
    const fixture = teamFixtures[gameweek] ?? teamFixtures[String(gameweek)];

    return {
        key: match.id ?? gameweek,
        gameweek,
        opponent: fixture?.opponent ?? "Unknown",
        points: toNumber(getStatLine(stats, "Total")?.points),
        minutes: getStatValue(stats, "Minutes played"),
        goals: getStatValue(stats, "Goals"),
        assists: getStatValue(stats, "Assists"),
        cleanSheets: getStatValue(stats, "Clean sheets"),
        goalsConceded: getStatValue(stats, "Goals conceded"),
        ownGoals: getStatValue(stats, "Own goals"),
        penaltiesSaved: getStatValue(stats, "Penalties saved"),
        penaltiesMissed: getStatValue(stats, "Penalties missed"),
        penaltiesConceded: getStatValue(stats, "Penalties conceded"),
        yellowCards: getStatValue(stats, "Yellow cards"),
        redCards: getStatValue(stats, "Red cards"),
    };
}

export function buildPlayerStatTotals(rows) {
    const numericFields = [
        "points",
        "minutes",
        "goals",
        "assists",
        "cleanSheets",
        "goalsConceded",
        "ownGoals",
        "penaltiesSaved",
        "penaltiesMissed",
        "penaltiesConceded",
        "yellowCards",
        "redCards",
    ];

    return Object.fromEntries(numericFields.map((field) => [
        field,
        rows.reduce((total, row) => total + row[field], 0),
    ]));
}
