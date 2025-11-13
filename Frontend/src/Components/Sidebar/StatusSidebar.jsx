import SidebarContainer from "./SidebarContainer";
import LeagueBlock from "./LeagueBlock";
import styles from "../../Styles/StatusSidebar.module.css";
import TeamOfTheWeekBlock from "./TeamOfTheWeekBlock";

function StatusSidebar({ user }) {
    return (
        <div className={styles.statusSidebar}>
            <SidebarContainer>
                <LeagueBlock currentUser={user} />
                <TeamOfTheWeekBlock />
            </SidebarContainer>
        </div>
    );
}

export default StatusSidebar;
