import { useEffect, useState } from "react";
import { useGameweek } from "../../Context/GameweeksContext";
import styles from "../../Styles/PointsSummaryBlock.module.css";
import { fetchUserPoints, fetchUserTotalPoints } from "../../services/pointsService";
import HistoryModal from "../General/HistoryModal";

function PointsSummaryBlock({ user }) {
    const [showHistory, setShowHistory] = useState(false);
    const { currentGameweek } = useGameweek();
    const [points, setPoints] = useState(null);
    const [totalPoints, setTotalPoints] = useState(null);

    useEffect(() => {
        if (!user || !currentGameweek) return;

        async function load() {
            try {
                const [pointsRes, totalPointsRes] = await Promise.all([
                    fetchUserPoints(user.id, currentGameweek.id),
                    fetchUserTotalPoints(user.id)
                ]);
                setPoints(pointsRes);
                setTotalPoints(totalPointsRes);
            } catch (error) {
                console.error("Error loading points:", error);
            }
        }

        load();

    }, [user, currentGameweek]);

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
                    <span className={styles.value}>{points !== null ? points : "-"}</span>
                </div>
                <div className={styles.row}>
                    <span>Overall Points</span>
                    <span className={styles.value}>{totalPoints !== null ? totalPoints : "-"}</span>
                </div>
            </div>

            <div
                className={styles.history}
                onClick={() => setShowHistory(true)}
                style={{ cursor: "pointer" }}
            >
                View History →
            </div>

            {showHistory && (
                <HistoryModal
                    userId={user.id}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </div>
    );
}

export default PointsSummaryBlock;