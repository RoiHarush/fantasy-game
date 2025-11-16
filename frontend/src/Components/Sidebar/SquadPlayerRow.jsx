import styles from "../../Styles/SquadPlayersTable.module.css";
import PlayerKit from "../General/PlayerKit";
import { Info } from "lucide-react";

function SquadPlayerRow({ player, fixture }) {
    return (
        <tr className={styles.row}>
            <td className={styles.infoCell}>
                <button
                    className={styles.infoBtn}
                    onClick={() => { }}
                    title="Player info"
                >
                    <Info size={16} />
                </button>
            </td>

            <td className={styles.playerCell}>
                <PlayerKit
                    teamId={player.teamId}
                    type={player.position === "GK" ? "gk" : "field"}
                    className={styles.kit}
                />
                <div className={styles.details}>
                    <span className={styles.name}>{player.viewName}</span>
                    <span className={styles.sub}>
                        {player.teamShort} &nbsp; {player.position}
                    </span>
                </div>
            </td>

            <td className={styles.fixtureCell}>{fixture}</td>
        </tr>
    );
}

export default SquadPlayerRow;
