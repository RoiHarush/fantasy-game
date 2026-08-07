import { useState } from "react";
import { usePlayers } from "../../features/players/usePlayers";
import styles from "../../Styles/SquadPlayersTable.module.css";
import PlayerKit from "../General/PlayerKit";
import { Info } from "lucide-react";
import { getPlayerById } from "../../Utils/ItemGetters";
import PlayerInfoModal from "../General/PlayerInfoModal";

function SquadPlayerRow({ player, fixture }) {
    const { players } = usePlayers();
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    return (
        <>
            <tr className={styles.row}>
                <td className={styles.infoCell}>
                    {player && <button
                        className={styles.infoBtn}
                        onClick={() => setSelectedPlayer(player)}
                        title="Player info"
                    >
                        <Info size={16} />
                    </button>}
                </td>

                <td className={styles.playerCell}>
                    <PlayerKit
                        teamId={player?.teamId || 0}
                        type={player?.position === "GK" ? "gk" : "field"}
                        className={styles.kit}
                    />
                    <div className={styles.details}>
                        <span className={styles.name}>{player?.viewName || "Empty slot"}</span>
                        <span className={styles.sub}>
                            {player ? <>{player.teamShort} &nbsp; {player.position}</> : "Waiting for draft pick"}
                        </span>
                    </div>
                </td>

                <td className={styles.fixtureCell}>{fixture}</td>
            </tr>

            {selectedPlayer && player && (
                <PlayerInfoModal
                    player={getPlayerById(players, selectedPlayer.id)}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </>
    );
}

export default SquadPlayerRow;

