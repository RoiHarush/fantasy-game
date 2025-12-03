import { useState, useEffect } from 'react';
import { useTeams } from '../Context/TeamsContext';
import { useFixtures } from '../Context/FixturesContext';

export function useAllTeamFixtures() {
    const { teams } = useTeams();
    const { getFixturesForTeam } = useFixtures();
    const [allFixtures, setAllFixtures] = useState(null);

    useEffect(() => {
        if (!teams || teams.length === 0) return;

        const fetchAll = async () => {
            const promises = teams.map(async (team) => {
                const data = await getFixturesForTeam(team.id);
                return { teamId: team.id, fixtures: data };
            });

            const results = await Promise.all(promises);

            const fixturesMap = {};
            results.forEach(result => {
                fixturesMap[result.teamId] = result.fixtures;
            });

            setAllFixtures(fixturesMap);
        };

        fetchAll();
    }, [teams, getFixturesForTeam]);

    return allFixtures;
}