import { useState } from "react";

import { useGameweek } from "../../features/gameweeks/useGameweek";
import {
    useUserGameweekPoints,
    useUserTotalPoints,
} from "../../features/points/usePointSummaries";
import styles from "../../Styles/PointsSummaryBlock.module.css";
import HistoryModal from "../General/HistoryModal";

function PointsSummaryBlock({ user, previewPoints }) {
    const [showHistory, setShowHistory] = useState(false);
    const { currentGameweek } = useGameweek();
    const preview = previewPoints != null;
    const pointsQuery = useUserGameweekPoints(user?.id, currentGameweek?.id, !preview);
    const totalQuery = useUserTotalPoints(user?.id, !preview);
    const gameweekPoints = preview ? previewPoints.gameweekPoints : pointsQuery.data;
    const totalPoints = preview ? previewPoints.totalPoints : totalQuery.data;
    const pointsPending = !preview && pointsQuery.isPending;
    const totalPending = !preview && totalQuery.isPending;
    const error = !preview && (pointsQuery.error || totalQuery.error);

    if (!user) return null;

    return (
        <div className={styles.block}>
            <div className={styles.header}>
                <div className={styles.userInfo}>
                    <h3 className={styles.username}>{user.name}</h3>
                    <p className={styles.team}>{user.fantasyTeamName}</p>
                </div>
            </div>

            <div className={styles.tab}>Points/Rankings</div>

            <div className={styles.stats}>
                <div className={styles.row}>
                    <span>Gameweek Points</span>
                    <span className={styles.value}>{pointsPending ? "…" : gameweekPoints ?? "-"}</span>
                </div>
                <div className={styles.row}>
                    <span>Overall Points</span>
                    <span className={styles.value}>{totalPending ? "…" : totalPoints ?? "-"}</span>
                </div>
            </div>

            {error && (
                <p role="alert">Some point totals are temporarily unavailable.</p>
            )}

            <button type="button" className={styles.history} onClick={() => setShowHistory(true)}>
                View History →
            </button>

            {showHistory && <HistoryModal userId={user.id} onClose={() => setShowHistory(false)} />}
        </div>
    );
}

export default PointsSummaryBlock;
