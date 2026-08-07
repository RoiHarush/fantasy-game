import { useGameweek } from "../../features/gameweeks/useGameweek";
import { useDreamTeam } from "../../features/status/useStatusData";
import styles from "../../Styles/TeamOfTheWeekBlock.module.css";
import PlayerKit from "../General/PlayerKit";

function TeamOfTheWeekBlock() {
    const { currentGameweek } = useGameweek();
    const dreamTeamQuery = useDreamTeam(currentGameweek?.id);
    const dreamTeam = dreamTeamQuery.data?.team ?? [];

    return (
        <div className={styles.block}>
            <div className={styles.header}>
                <span className={styles.icon}>★</span>
                Team of the Week
            </div>

            {dreamTeamQuery.isPending ? (
                <p className={styles.loading}>Loading dream team...</p>
            ) : dreamTeam.length === 0 ? (
                <p className={styles.loading}>No dream team is available yet.</p>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead><tr><th>Pos</th><th>Player</th><th>Club</th><th>Pts</th></tr></thead>
                        <tbody>
                            {dreamTeam.map((player, index) => (
                                <tr key={player.id ?? `row-${index}`}>
                                    <td>{player.position}</td>
                                    <td className={styles.playerCell}>
                                        <PlayerKit
                                            teamId={player.teamId}
                                            type={player.position === "GK" ? "gk" : "field"}
                                            className={styles["player-shirt"]}
                                        />
                                        <span>{player.name}</span>
                                    </td>
                                    <td>{player.team}</td>
                                    <td className={styles.points}>{player.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default TeamOfTheWeekBlock;
