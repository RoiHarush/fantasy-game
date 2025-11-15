import styles from "../../Styles/LeagueBlock.module.css";
import LeagueTable from "../Pages/LeagueTab/LeagueTable";


function LeagueBlock({ currentUser, league }) {

    return (
        <div className={styles.block}>
            <div className={styles.header}>League Standings</div>
            <div className={styles.content}>
                <LeagueTable league={league} currentUser={currentUser} compact={true} />
            </div>
        </div>
    );
}

export default LeagueBlock;
