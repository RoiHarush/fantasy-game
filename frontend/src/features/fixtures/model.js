import { getAppDateKey } from "../../lib/dateTime";

export function getFixtureItems(fixtureGroup) {
    if (!fixtureGroup) return [];
    if (Array.isArray(fixtureGroup)) return fixtureGroup;
    if (Array.isArray(fixtureGroup.fixtures)) return fixtureGroup.fixtures;
    return [fixtureGroup];
}

export function combineFixtureGroup(fixtureGroup) {
    const fixtures = getFixtureItems(fixtureGroup).filter(Boolean);
    if (fixtures.length === 0) return null;
    return {
        ...fixtures[0],
        opponent: fixtures.map((fixture) => fixture.opponent).join(" • "),
        difficulty: fixtures.length === 1 ? fixtures[0].difficulty : null,
        difficulties: fixtures.map((fixture) => fixture.difficulty || 3),
        fixtures,
        fixtureCount: fixtures.length,
    };
}

export function normalizeTeamFixtures(teamFixtures = {}) {
    return Object.fromEntries(
        Object.entries(teamFixtures).map(([gameweek, fixtures]) => [gameweek, combineFixtureGroup(fixtures)]),
    );
}

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
