import styles from "../../Styles/LeagueBlock.module.css";
import LeagueTable from "../Pages/LeagueTab/LeagueTable";


function LeagueBlock({ currentUser }) {
    return (
        <div className={styles.block}>
            <div className={styles.header}>League Standings</div>
            <div className={styles.content}>
                <LeagueTable currentUser={currentUser} compact={true} />
            </div>
        </div>
    );
}

export default LeagueBlock;
