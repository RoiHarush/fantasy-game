import { useState } from "react";
import { usePlayers } from "../../Context/PlayersContext";
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
                    <button
                        className={styles.infoBtn}
                        onClick={() => setSelectedPlayer(player)}
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

            {selectedPlayer && (
                <PlayerInfoModal
                    player={getPlayerById(players, selectedPlayer.id)}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </>
    );
}

export default SquadPlayerRow;

