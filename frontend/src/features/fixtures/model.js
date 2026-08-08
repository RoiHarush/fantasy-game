import { getAppDateKey } from "../../lib/dateTime";

export function getDefaultFixturesGameweek({ gameweeks = [], nextGameweek, currentGameweek, lastGameweek }) {
    const preferred = nextGameweek ?? currentGameweek ?? lastGameweek;
    return gameweeks.find((gameweek) => String(gameweek.id) === String(preferred?.id))
        ?? gameweeks[0]
        ?? null;
}

export function getFixtureGameweekNavigation(gameweeks = [], selectedGameweekId) {
    const orderedGameweeks = [...gameweeks].sort((left, right) => Number(left.id) - Number(right.id));
    const selectedIndex = orderedGameweeks.findIndex(
        (gameweek) => String(gameweek.id) === String(selectedGameweekId),
    );

    return {
        orderedGameweeks,
        selectedIndex,
        canGoPrevious: selectedIndex > 0,
        canGoNext: selectedIndex >= 0 && selectedIndex < orderedGameweeks.length - 1,
    };
}

export function groupFixturesByDay(fixtures = []) {
    const groups = new Map();

    fixtures.forEach((fixture) => {
        const dateKey = getAppDateKey(fixture.kickoff_time);
        if (!dateKey) return;
        const dayFixtures = groups.get(dateKey) ?? [];
        dayFixtures.push(fixture);
        groups.set(dateKey, dayFixtures);
    });

    return [...groups.entries()]
        .map(([dateKey, dayFixtures]) => ({
            dateKey,
            fixtures: [...dayFixtures].sort(
                (left, right) => new Date(left.kickoff_time) - new Date(right.kickoff_time),
            ),
        }))
        .sort((left, right) => (
            new Date(left.fixtures[0].kickoff_time) - new Date(right.fixtures[0].kickoff_time)
        ));
}
