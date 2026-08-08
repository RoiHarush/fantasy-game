import { isSameEntityId } from "../../../features/league/model";
import styles from "../../../Styles/LeagueTable.module.css";
import TableUser from "./TableUser";

function LeagueTable({ currentUser, league, compact = false }) {
    const users = league.users ?? [];

    return (
        <div className={`${styles.leagueTable} ${compact ? styles.compact : styles.full}`}>
            <table>
                <caption className="sr-only">{league.name} standings</caption>
                <thead className={styles["leagueTable-head"]}>
                    <tr>
                        <th scope="col" className={styles.rankColumn}>Rank</th>
                        <th scope="col" className={styles.teamHeader}>Team</th>
                        <th scope="col"><abbr title="Gameweek points">GW</abbr></th>
                        <th scope="col"><abbr title="Total points">TOT</abbr></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr
                            key={user.id}
                            className={isSameEntityId(user.id, currentUser.id) ? styles.currentUserRow : ""}
                        >
                            <td className={styles.rankColumn}>{user.rank}</td>

                            <td className={styles.teamCell}>
                                <TableUser user={user} currentUser={currentUser} />
                            </td>
                            <td>{user.gwPoints}</td>
                            <td>{user.points}</td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan="4">No managers are available in this league yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default LeagueTable;
