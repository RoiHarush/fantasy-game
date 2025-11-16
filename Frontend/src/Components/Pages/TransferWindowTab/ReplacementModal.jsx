import { useEffect, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import Style from "../../../Styles/TransferModal.module.css";
import PlayerKit from "../../General/PlayerKit"
import API_URL from "../../../config";


function ReplacementModal({ playerIn, user, setUser, onClose, players }) {
    const { nextGameweek } = useGameweek();
    const [squad, setSquad] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSquad() {
            try {
                const res = await fetch(`${API_URL}/api/users/${user.id}/squad?gw=${nextGameweek.id}`);
                if (!res.ok) throw new Error("Failed to load squad");
                const data = await res.json();
                setSquad(data);
            } catch (err) {
                console.error("Error fetching squad:", err);
            } finally {
                setLoading(false);
            }
        }

        if (user?.id && nextGameweek?.id) {
            fetchSquad();
        }
    }, [user, nextGameweek]);

    if (!playerIn || loading) {
        return (
            <div className={Style.overlay}>
                <div className={Style.modal}>
                    <p>Loading squad data...</p>
                </div>
            </div>
        );
    }

    if (!squad) {
        return (
            <div className={Style.overlay}>
                <div className={Style.modal}>
                    <p>Could not load squad for this user.</p>
                    <button className={Style.closeBtn} onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    const lineupArrays = Object.values(squad.startingLineup || {});
    const benchIds = Object.values(squad.bench || {});
    const allPlayerIds = lineupArrays.flat().concat(benchIds);

    const samePositionPlayers = players.filter(
        (p) => allPlayerIds.includes(p.id) && p.position === playerIn.position
    );

    const handleReplace = (playerOut) => {
        setUser((prev) => ({
            ...prev,
            squad: {
                ...squad,
                startingLineup: {
                    ...squad.startingLineup,
                    [playerOut.position]: (squad.startingLineup[playerOut.position] || []).map((id) =>
                        id === playerOut.id ? playerIn.id : id
                    ),
                },
                bench: Object.fromEntries(
                    Object.entries(squad.bench || {}).map(([slot, id]) =>
                        [slot, id === playerOut.id ? playerIn.id : id]
                    )
                ),
            },
        }));

        fetch(`${API_URL}/api/transfers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: user.id,
                playerOutId: playerOut.id,
                playerInId: playerIn.id
            })
        })
            .then(res => {
                if (!res.ok) throw new Error("Transfer failed");
                return res.text();
            })
            .then(msg => console.log("✅ Transfer completed:", msg))
            .catch(err => console.error("❌ Transfer error:", err));

        onClose();
    };


    return (
        <div className={Style.overlay}>
            <div className={Style.modal}>
                <h3>
                    You have requested to sign{" "}
                    <span className={Style.green}>{playerIn.viewName}</span>.
                </h3>

                <div className={Style.section}>
                    <table className={Style.table}>
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Points</th>
                                <th>GW8</th>
                                <th>GW9</th>
                                <th>GW10</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className={Style.playerCell}>
                                    <PlayerKit
                                        teamId={playerIn.teamId}
                                        type={playerIn.position === "GK" ? "gk" : "field"}
                                        className={Style["player-shirt"]}
                                    />
                                    <span>{playerIn.viewName}</span>
                                </td>
                                <td>{playerIn.points}</td>
                                <td>{playerIn.nextFixtures?.[0] || "-"}</td>
                                <td>{playerIn.nextFixtures?.[1] || "-"}</td>
                                <td>{playerIn.nextFixtures?.[2] || "-"}</td>
                                <td>
                                    <button className={Style.cancelBtnSmall} onClick={onClose}>
                                        Cancel
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h4 className={Style.subtitle}>
                    Which player would you like{" "}
                    <span className={Style.green}>{playerIn.viewName}</span> to replace?
                </h4>

                <div className={Style.section}>
                    <table className={Style.table}>
                        <thead>
                            <tr>
                                <th>Player</th>
                                <th>Points</th>
                                <th>GW8</th>
                                <th>GW9</th>
                                <th>GW10</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {samePositionPlayers.length > 0 ? (
                                samePositionPlayers.map((p) => (
                                    <tr key={p.id}>
                                        <td className={Style.playerCell}>
                                            <PlayerKit
                                                teamId={p.teamId}
                                                type={p.position === "GK" ? "gk" : "field"}
                                                className={Style["player-shirt"]}
                                            />
                                            <span>{p.viewName}</span>
                                        </td>
                                        <td>{p.points}</td>
                                        <td>{p.nextFixtures?.[0] || "-"}</td>
                                        <td>{p.nextFixtures?.[1] || "-"}</td>
                                        <td>{p.nextFixtures?.[2] || "-"}</td>
                                        <td>
                                            <button
                                                className={Style.replaceBtn}
                                                onClick={() => handleReplace(p)}
                                            >
                                                Replace
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", color: "#aaa" }}>
                                        No players in this position.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <button className={Style.closeBtn} onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}

export default ReplacementModal;
