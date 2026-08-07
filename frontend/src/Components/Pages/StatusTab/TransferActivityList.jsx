import { useMemo } from "react";
import { useAuth } from "../../../Context/AuthContext";
import { usePlayers } from "../../../features/players/usePlayers";
import { useTransferHistory } from "../../../features/transfer-window/useTransferWindow";
import styles from "../../../Styles/TransferActivityList.module.css";

function TransferActivityList({ gameWeekId }) {
    const { players } = usePlayers();
    const { user } = useAuth();
    const historyQuery = useTransferHistory(user?.leagueId, gameWeekId, {
        staleTime: 30_000,
    });
    const actions = useMemo(
        () => (historyQuery.data ?? []).filter(action => action.windowType === "TRANSFER"),
        [historyQuery.data],
    );

    const playersById = useMemo(
        () => new Map(players.map(player => [player.id, player])),
        [players]
    );
    const grouped = useMemo(() => actions.reduce((result, action) => {
        const key = action.userId;
        if (!result.has(key)) result.set(key, { name: action.userName, actions: [] });
        result.get(key).actions.push(action);
        return result;
    }, new Map()), [actions]);

    const playerName = id => playersById.get(id)?.viewName || `Player #${id}`;

    return (
        <section className={styles.section}>
            <h3>Gameweek {gameWeekId} transfers</h3>
            {actions.length === 0 ? (
                <p className={styles.empty}>No transfers have been completed for this gameweek.</p>
            ) : (
                <div className={styles.users}>
                    {[...grouped.entries()].map(([userId, group]) => (
                        <article key={userId} className={styles.userCard}>
                            <h4>{group.name}</h4>
                            <ul>
                                {group.actions.map(action => (
                                    <li key={action.id}>
                                        <span className={styles.in}>IN {playerName(action.playerInId)}</span>
                                        <span className={styles.out}>OUT {playerName(action.playerOutId)}</span>
                                        <small>{action.source === "WAIVER" ? "Waiver" : "Manual"}</small>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

export default TransferActivityList;
