import { useEffect, useState } from "react";
import { usePlayers } from "../../Context/PlayersContext";
import { useGameweek } from "../../Context/GameweeksContext";
import styles from "../../Styles/TeamOfTheWeekBlock.module.css";
import API_URL from "../../config";
import PlayerKit from "../General/PlayerKit";

function TeamOfTheWeekBlock() {
    const { players } = usePlayers();
    const { currentGameweek } = useGameweek();
    const [dreamTeam, setDreamTeam] = useState([]);

    useEffect(() => {
        async function fetchDreamTeam() {
            if (!currentGameweek) return;

            try {
                const res = await fetch(`${API_URL}/api/fpl/dream-team/${currentGameweek.id}`);
                const data = await res.json();

                if (!data?.team?.length) return;

                setDreamTeam(data.team);
            } catch (err) {
                console.error("❌ Failed to fetch Dream Team:", err);
            }
        }

        fetchDreamTeam();
    }, [currentGameweek]);

    return (
        <div className={styles.block}>
            <div className={styles.header}>
                <span className={styles.icon}>★</span>
                Team of the Week
            </div>

            {dreamTeam.length === 0 ? (
                <p className={styles.loading}>Loading dream team...</p>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Player</th>
                                <th>Club</th>
                                <th>Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dreamTeam.map((p, index) => (
                                <tr key={p.id ?? `row-${index}`}>
                                    <td>{p.position}</td>
                                    <td className={styles.playerCell}>
                                        <PlayerKit
                                            teamId={p.teamId}
                                            type={p.position === "GK" ? "gk" : "field"}
                                            className={styles["player-shirt"]} />
                                        <span>{p.name}</span>
                                    </td>
                                    <td>{p.team}</td>
                                    <td className={styles.points}>{p.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default TeamOfTheWeekBlock;
