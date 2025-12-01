import PlayerKit from "../General/PlayerKit";
import styles from "../../Styles/PlayerOfWeekCard.module.css";

function PlayerOfWeekCard({ player, size = "normal" }) {
    if (!player) return null;

    const hasPoints = player.points !== null && player.points !== undefined;

    const cardClass = `${styles.card} ${size === "small" ? styles.small : ""}`;

    return (
        <div className={cardClass}>
            <PlayerKit
                teamId={player.teamId ?? 0}
                type={player.position === "GK" ? "gk" : "field"}
                className={styles.kit}
            />

            <div className={styles.name}>{player.playerName || "-"}</div>

            <div
                className={styles.bottom}
                style={{
                    justifyContent: hasPoints ? "space-between" : "center",
                }}
            >
                <div className={styles.gw}>GW{player.gameweek}</div>
                {hasPoints && (
                    <div className={styles.points}>{player.points} pts</div>
                )}
            </div>
        </div>
    );
}

export default PlayerOfWeekCard;