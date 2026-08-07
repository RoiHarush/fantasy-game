import { usePlayers } from "../../Context/PlayersContext";
import { useCallback } from "react";
import SquadPlayerRow from "./SquadPlayerRow";
import styles from "../../Styles/SquadPlayersTable.module.css";
import { useGameweek } from "../../Context/GameweeksContext";
import { useAllTeamFixtures } from "../../hooks/useAllTeamFixtures";

const EMPTY_SQUAD = { startingLineup: {}, bench: {} };

function SquadPlayersTable({ squad }) {
    const { players } = usePlayers();
    const { nextGameweek } = useGameweek();
    const fixtures = useAllTeamFixtures() ?? {};
    const safeSquad = squad || EMPTY_SQUAD;

    const getPlayer = useCallback((id) => players.find((p) => p.id === id), [players]);

    const sections = [
        { key: "GK", label: "Goalkeepers", size: 2 },
        { key: "DEF", label: "Defenders", size: 5 },
        { key: "MID", label: "Midfielders", size: 5 },
        { key: "FWD", label: "Forwards", size: 3 },
    ];

    const getNextFixtureText = (player) => {
        if (!nextGameweek) return "-";

        const teamFixtures = fixtures[player.teamId];
        if (!teamFixtures) return "-";

        const fixture = teamFixtures[nextGameweek.id];

        if (!fixture) return "-";

        const match = fixture.opponent.match(/^(.*)\s\((H|A)\)$/);
        const fullName = match ? match[1].trim() : fixture.opponent;
        const ha = match ? match[2] : "";

        return `${fullName} (${ha})`;
    };



    const getPlayersByPosition = (posKey) => {
        const starting = safeSquad.startingLineup?.[posKey] || [];
        const benchIds = Object.values(safeSquad.bench || {});
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
                const slots = Array.from({ length: section.size }, (_, index) => ids[index] ?? null);
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
                                {slots.map((id, index) => {
                                    const player = getPlayer(id);
                                    return (
                                        <SquadPlayerRow
                                            key={id || `${section.key}-empty-${index}`}
                                            player={player}
                                            fixture={player ? getNextFixtureText(player) : "-"}
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
