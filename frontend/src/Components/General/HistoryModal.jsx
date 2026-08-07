import { useEffect, useState } from "react";
import styles from "../../Styles/HistoryModal.module.css";
import { apiRequest } from "../../services/apiClient";

function HistoryModal({ userId, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        async function fetchHistory() {
            try {
                const data = await apiRequest(`/api/points/${userId}/history`);
                setHistory(data || []);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [userId]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Gameweek History</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <p>Loading history...</p>
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
