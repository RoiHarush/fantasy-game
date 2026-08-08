import SidebarContainer from "../Sidebar/SidebarContainer";
import SquadPlayersTable from "./SquadPlayersTable";
import styles from "../../Styles/UserSquadSidebar.module.css";

function UserSquadSidebar({ user, squad, players, fixturesByTeam, nextGameweek }) {
    if (!user || !squad) return null;

    return (
        <SidebarContainer>
            <div className={styles.sidebarBlock}>
                <div className={styles.header}>{user.fantasyTeamName}</div>
                <div className={styles.content}>
                    <SquadPlayersTable
                        squad={squad}
                        players={players}
                        fixturesByTeam={fixturesByTeam}
                        nextGameweek={nextGameweek}
                    />
                </div>
            </div>
        </SidebarContainer>
    );
}

export default UserSquadSidebar;

