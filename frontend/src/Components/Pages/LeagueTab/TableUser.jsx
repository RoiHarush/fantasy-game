"use client";

import { useRouter } from "next/navigation";
import Style from "../../../Styles/LeagueTable.module.css";

function TableUser({ user, currentUser }) {
    const router = useRouter();

    const handleClick = () => {
        if (user.userId === currentUser.id) {
            router.push("/points");
        } else {
            router.push(`/points/${user.id}`);
        }
    };

    return (
        <div className={Style.tableUser} onClick={handleClick}>
            <span className={Style.userName}>{user.name}</span>
            <span className={Style.userTeam}>{user.fantasyTeamName}</span>
        </div>
    );
}

export default TableUser;
