import { useGameweek } from "../../Context/GameweeksContext";
import styles from "../../Styles/PointsSummaryBlock.module.css";

function PointsSummaryBlock({ user }) {
    const { currentGw } = useGameweek();

    if (!user) return null;

    return (
        <div className={styles.block}>
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    <h3 className={styles.username}>{user.name}</h3>
                    <p className={styles.team}>{user.teamName}</p>
                </div>
            </div>

            <div className={styles.tab}>Points/Rankings</div>

            <div className={styles.stats}>
                <div className={styles.row}>
                    <span>Gameweek Points</span>
                    <span className={styles.value}>{0}</span>
                </div>
                <div className={styles.row}>
                    <span>Overall Points</span>
                    <span className={styles.value}>{user.totalPoints ? user.totalPoints : 0}</span>
                </div>
            </div>

            <div className={styles.history}>View History →</div>
        </div>
    );
}

export default PointsSummaryBlock;
