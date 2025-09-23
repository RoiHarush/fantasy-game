import Style from "../../../Styles/PlayerTable.module.css"
import getUserFromId from "../../../Utillites/GetUser";
import WatchButton from "../../General/WatchButton";
import PlayerRow from "./PlayerRow";

function PlayerTable({ players, user, setUser, mode = "scout" }) {
    return (
        <div className={Style.tableContainer}>
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Points</th>
                        {mode === "scout" && <th>Watchlist</th>}
                        {mode === "scout" && <th>Owner</th>}
                        {mode === "draft" && <th>Sign</th>}
                    </tr>
                </thead>
                <tbody>
                    {players.map((player) => {
                        let ownerInfo = null;
                        if (mode === "scout") {
                            if (player.available) {
                                ownerInfo = <span>Free Agent</span>;
                            } else {
                                const owner =
                                    player.ownerId === user.id
                                        ? "me"
                                        : getUserFromId(player.ownerId).name;
                                ownerInfo = <span>{owner}</span>;
                            }
                        }

                        return (
                            <PlayerRow
                                key={player.id}
                                player={player}
                                watchlist={
                                    mode === "scout" ? (
                                        <WatchButton
                                            playerId={player.id}
                                            user={user}
                                            setUser={setUser}
                                        />
                                    ) : null
                                }
                                sign={
                                    mode === "draft" ? (
                                        player.available ? (
                                            <button className={Style["sign-btn"]}>Sign</button>
                                        ) : (
                                            <span>
                                                Owned by{" "}
                                                {player.ownerId === user.id
                                                    ? "me"
                                                    : getUserFromId(player.ownerId).name}
                                            </span>
                                        )
                                    ) : null
                                }
                                owner={ownerInfo}
                            />
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default PlayerTable;
