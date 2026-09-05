export function getLiveManagers(fixtures = []) {
    const managers = new Map();
    fixtures.forEach((fixture) => fixture.players?.forEach((player) => {
        if (!managers.has(player.ownerUserId)) {
            managers.set(player.ownerUserId, {
                id: player.ownerUserId,
                name: player.ownerName,
                teamName: player.ownerTeamName,
            });
        }
    }));
    return [...managers.values()].sort((left, right) => (
        left.teamName.localeCompare(right.teamName, "en", { sensitivity: "base" })
    ));
}

export function filterLiveFixtures(fixtures = [], managerId = "all", participation = "all") {
    return fixtures.map((fixture) => ({
        ...fixture,
        players: (fixture.players ?? []).filter((player) => {
            const managerMatches = managerId === "all" || String(player.ownerUserId) === String(managerId);
            const participationMatches = participation === "all" || player.participation !== "NOT_PLAYED";
            return managerMatches && participationMatches;
        }),
    }));
}
