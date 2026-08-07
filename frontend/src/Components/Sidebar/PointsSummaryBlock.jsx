import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useGameweek } from "../../Context/GameweeksContext";
import { queryKeys } from "../../lib/query/keys";
import { fetchUserPoints, fetchUserTotalPoints } from "../../services/pointsService";
import styles from "../../Styles/PointsSummaryBlock.module.css";
import HistoryModal from "../General/HistoryModal";

function PointsSummaryBlock({ user }) {
    const [showHistory, setShowHistory] = useState(false);
    const { currentGameweek } = useGameweek();
    const pointsQuery = useQuery({
        queryKey: queryKeys.userGameweekPoints(user?.id, currentGameweek?.id),
        queryFn: () => fetchUserPoints(user.id, currentGameweek.id),
        enabled: Boolean(user?.id && currentGameweek?.id),
    });
    const totalQuery = useQuery({
        queryKey: queryKeys.userTotalPoints(user?.id),
        queryFn: () => fetchUserTotalPoints(user.id),
        enabled: Boolean(user?.id),
        staleTime: 30_000,
    });

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
