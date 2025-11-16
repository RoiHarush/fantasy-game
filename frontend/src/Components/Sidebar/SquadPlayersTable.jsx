import { usePlayers } from "../../Context/PlayersContext";
import { useFixtures } from "../../Context/FixturesContext";
import { useEffect, useState } from "react";
import SquadPlayerRow from "./SquadPlayerRow";
import styles from "../../Styles/SquadPlayersTable.module.css";

function SquadPlayersTable({ squad }) {
    const { players } = usePlayers();
    const { getFixturesForTeam } = useFixtures();
    const [fixtures, setFixtures] = useState({});

    const getPlayer = (id) => players.find((p) => p.id === id);

    const sections = [
        { key: "GK", label: "Goalkeepers" },
        { key: "DEF", label: "Defenders" },
        { key: "MID", label: "Midfielders" },
        { key: "FWD", label: "Forwards" },
    ];

    useEffect(() => {
        async function fetchAll() {
            const allIds = [
                ...Object.values(squad.startingLineup).flat(),
                ...Object.values(squad.bench),
            ];
            const allTeams = new Set(
                allIds.map((id) => getPlayer(id)?.teamId).filter(Boolean)
            );

            const data = {};
            for (const teamId of allTeams) {
                data[teamId] = await getFixturesForTeam(teamId);
            }
            setFixtures(data);
        }
        fetchAll();
    }, [squad, players]);

    const getNextFixtureText = (player) => {
        const teamFixtures = fixtures[player.teamId];
        if (!teamFixtures || !teamFixtures.length) return "-";
        const f = teamFixtures[0];
        const isHome = f.homeTeamId === player.teamId;
        const opponent = isHome ? f.awayTeamShort : f.homeTeamShort;
        return `${opponent}(${isHome ? "H" : "A"})`;
    };

    const getPlayersByPosition = (posKey) => {
        const starting = squad.startingLineup[posKey] || [];
        const benchIds = Object.values(squad.bench) || [];
        const benchOfPos = benchIds.filter((id) => {
            const p = getPlayer(id);
            return p && p.position === posKey;
        });
        return [...starting, ...benchOfPos];
    };

    return (
        <div className={styles.tableWrapper}>
            {sections.map((section) => {
                const ids = getPlayersByPosition(section.key);
                if (ids.length === 0) return null;
                return (
                    <div key={section.key} className={styles.section}>
                        <div className={styles.positionHeader}>
                            {section.label}
                        </div>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.emptyTh}></th>
                                    <th className={styles.emptyTh}></th>
                                    <th className={styles.fixHeaderTh}>FIX</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ids.map((id) => {
                                    const player = getPlayer(id);
                                    if (!player) return null;
                                    return (
                                        <SquadPlayerRow
                                            key={id}
                                            player={player}
                                            fixture={getNextFixtureText(player)}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            })}

        </div>
    );
}

export default SquadPlayersTable;
