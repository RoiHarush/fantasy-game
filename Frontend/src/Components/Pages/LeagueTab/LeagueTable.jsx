import { useEffect, useState } from "react";
import TableUser from "./TableUser";
import Style from "../../../Styles/LeagueTable.module.css";
import { useGameweek } from "../../../Context/GameweeksContext";
import API_URL from "../../../config";

function LeagueTable({ currentUser, compact = false }) {
    const { currentGameweek } = useGameweek();
    const [league, setLeague] = useState(null);

    useEffect(() => {
        if (currentGameweek) {
            fetch(`${API_URL}/api/league?gw=${currentGameweek.id}`)
                .then(res => res.json())
                .then(data => setLeague(data))
                .catch(err => console.error("Failed to fetch league:", err));
        }
    }, [currentGameweek]);

    if (!currentGameweek || !league) {
        return <div>Loading league...</div>;
    }

    return (
        <div
            className={`${Style.leagueTable} ${compact ? Style.compact : Style.full
                }`}
        >
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
