import Link from "next/link";

import { getLeagueMemberPointsHref } from "../../../features/league/model";
import styles from "../../../Styles/LeagueTable.module.css";

function TableUser({ user, currentUser }) {
    const href = getLeagueMemberPointsHref(user.id, currentUser.id);

    return (
        <Link href={href} className={styles.tableUser} aria-label={`View ${user.fantasyTeamName} points`}>
            <span className={styles.userName}>{user.name}</span>
            <span className={styles.userTeam}>{user.fantasyTeamName}</span>
        </Link>
    );
}

export default TableUser;
