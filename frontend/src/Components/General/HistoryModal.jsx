import styles from "../../Styles/HistoryModal.module.css";
import { usePointsHistory } from "../../features/points/usePointSummaries";

function HistoryModal({ userId, onClose }) {
    const historyQuery = usePointsHistory(userId);
    const history = historyQuery.data ?? [];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Gameweek History</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.content}>
                    {historyQuery.isPending ? (
                        <p>Loading history...</p>
                    ) : historyQuery.error ? (
                        <p role="alert">{historyQuery.error.message}</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Round</th>
                                    <th>Points</th>
                                    <th>Total Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((gw) => (
                                    <tr key={gw.gameweek}>
                                        <td>Gameweek {gw.gameweek}</td>
                                        <td className={styles.points}>{gw.points}</td>

                                        <td className={styles.total}>{gw.totalPoints}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HistoryModal;
