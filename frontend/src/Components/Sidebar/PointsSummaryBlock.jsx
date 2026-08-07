import { useState } from "react";

import { useGameweek } from "../../features/gameweeks/useGameweek";
import {
    useUserGameweekPoints,
    useUserTotalPoints,
} from "../../features/points/usePointSummaries";
import styles from "../../Styles/PointsSummaryBlock.module.css";
import HistoryModal from "../General/HistoryModal";

function PointsSummaryBlock({ user }) {
    const [showHistory, setShowHistory] = useState(false);
    const { currentGameweek } = useGameweek();
    const pointsQuery = useUserGameweekPoints(user?.id, currentGameweek?.id);
    const totalQuery = useUserTotalPoints(user?.id);

    if (!user) return null;

    return (
        <div className={styles.block}>
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    <h3 className={styles.username}>{user.name}</h3>
                    <p className={styles.team}>{user.fantasyTeam}</p>
                </div>
            </div>

            <div className={styles.tab}>Points/Rankings</div>

            <div className={styles.stats}>
                <div className={styles.row}>
                    <span>Gameweek Points</span>
                    <span className={styles.value}>{pointsQuery.data ?? "-"}</span>
                </div>
                <div className={styles.row}>
                    <span>Overall Points</span>
                    <span className={styles.value}>{totalQuery.data ?? "-"}</span>
                </div>
            </div>

            <button className={styles.history} onClick={() => setShowHistory(true)}>
                View History →
            </button>

            {showHistory && <HistoryModal userId={user.id} onClose={() => setShowHistory(false)} />}
        </div>
    );
}

export default PointsSummaryBlock;
