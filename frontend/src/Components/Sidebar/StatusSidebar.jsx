import SidebarContainer from "./SidebarContainer";
import LeagueBlock from "./LeagueBlock";
import styles from "../../Styles/StatusSidebar.module.css";
import TeamOfTheWeekBlock from "./TeamOfTheWeekBlock";

function StatusSidebar({ user, league, preSeason = false }) {
    return (
        <div className={styles.statusSidebar}>
            <SidebarContainer>
                <LeagueBlock league={league} currentUser={user} />
                {!preSeason && <TeamOfTheWeekBlock />}
            </SidebarContainer>
        </div>
    );
}

export default StatusSidebar;
