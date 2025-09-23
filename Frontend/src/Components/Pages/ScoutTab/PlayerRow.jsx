import Style from "../../../Styles/PlayerTable.module.css"
import PlayerKit from "../../General/PlayerKit";
import teams from "../../../MockData/Teams";

function PlayerRow({ player, watchlist, sign, owner }) {
    const teamName = teams.find(t => t.id === player.team)?.shortName || "";

    return (
        <tr>
            <td className={Style["player-main-cell"]}>
                <div className={Style["player-cell"]}>
                    <PlayerKit
                        teamId={player.team}
                        type={player.position === "GK" ? "gk" : "field"}
                        className={Style["player-shirt"]}
                    />
                    <div className={Style["player-info"]}>
                        <span className={Style["player-name"]}>{player.viewName}</span>
                        <span className={Style["player-subinfo"]}>
                            {teamName} &nbsp; {player.position}
                        </span>
                    </div>
                </div>
            </td>
            <td>{player.points}</td>
            {watchlist && <td>{watchlist}</td>}
            {owner && <td>{owner}</td>}
            {sign && <td>{sign}</td>}
        </tr>
    )
}



export default PlayerRow


