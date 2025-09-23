import TableUser from "./TableUser";
import Style from "../../../Styles/LeagueTable.module.css";

function LeagueTable({ league, currentUser }) {
    return (
        <div className={Style.leagueTable}>
            <table>
                <thead className={Style["leagueTable-head"]}>
                    <tr>
                        <th>Rank</th>
                        <th className={Style.teamHeader}>Team & Manager</th>
                        <th>GW</th>
                        <th>TOT</th>
                    </tr>
                </thead>

                <tbody>
                    {league.standings.map(user => (
                        <tr
                            key={user.userId}
                            className={user.userId === currentUser.id ? Style.currentUserRow : ""}
                        >
                            <td>{user.rank}</td>
                            <td className={Style.teamCell}>
                                <TableUser user={user} currentUser={currentUser} />
                            </td>

                            <td>{user.gwPoints}</td>
                            <td>{user.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default LeagueTable;
