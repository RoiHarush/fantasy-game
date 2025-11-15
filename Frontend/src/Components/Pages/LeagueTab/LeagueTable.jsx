import Style from "../../../Styles/LeagueTable.module.css";
import TableUser from "./TableUser";

function LeagueTable({ currentUser, league, compact = false }) {
    return (
        <div className={`${Style.leagueTable} ${compact ? Style.compact : Style.full}`}>
            <table>
                <thead className={Style["leagueTable-head"]}>
                    <tr>
                        <th>Rank</th>
                        <th className={Style.teamHeader}>Team</th>
                        <th>GW</th>
                        <th>TOT</th>
                    </tr>
                </thead>
                <tbody>
                    {league.users?.map(user => (
                        <tr
                            key={user.id}
                            className={user.id === currentUser.id ? Style.currentUserRow : ""}
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
