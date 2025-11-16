import SidebarContainer from "../Sidebar/SidebarContainer";
import SquadPlayersTable from "./SquadPlayersTable";
import styles from "../../Styles/UserSquadSidebar.module.css";

function UserSquadSidebar({ user, squad }) {
    if (!user || !squad) return null;

    return (
        <SidebarContainer>
            <div className={styles.sidebarBlock}>
                <div className={styles.header}>{user.fantasyTeam}</div>
                <div className={styles.content}>
                    <SquadPlayersTable squad={squad} />
                </div>
            </div>
        </SidebarContainer>
    );
}

export default UserSquadSidebar;

