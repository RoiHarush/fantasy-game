import { useEffect, useMemo, useState } from "react";
import { useGameweek } from "../../../Context/GameweeksContext";
import { useFixtures } from "../../../Context/FixturesContext";
import Style from "../../../Styles/TransferModal.module.css";
import PlayerKit from "../../General/PlayerKit";
import API_URL from "../../../config";
import { getAuthHeaders } from "../../../services/authHelper";
import TeamShortNames from "../../../Utils/teamNameMap";

function ReplacementModal({ playerIn, user, setUser, onClose, players }) {
    const { nextGameweek } = useGameweek();
    const { getFixturesForTeam } = useFixtures();

    const [squad, setSquad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [allFixtures, setAllFixtures] = useState({});

    useEffect(() => {
        async function fetchSquad() {
            try {
                const res = await fetch(`${API_URL}/api/teams/${user.id}/squad?gw=${nextGameweek.id}`, {
                    headers: getAuthHeaders()
                });

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

    const samePositionPlayers = useMemo(() => {
        if (!playerIn) return [];
        const lineupArrays = Object.values(squad?.startingLineup || {});
        const benchIds = Object.values(squad?.bench || {});
        const allPlayerIds = lineupArrays.flat().concat(benchIds);
        return players.filter(
            (p) => allPlayerIds.includes(p.id) && p.position === playerIn.position
        );
    }, [playerIn, players, squad]);

    useEffect(() => {
        const fetchAllFixtures = async () => {
            const teamsToFetch = new Set();

            if (playerIn?.teamId) teamsToFetch.add(playerIn.teamId);

            samePositionPlayers.forEach(p => {
                if (p.teamId) teamsToFetch.add(p.teamId);
            });

            const entries = await Promise.all(
                [...teamsToFetch].map(async teamId => [teamId, await getFixturesForTeam(teamId)])
            );
            setAllFixtures(Object.fromEntries(entries));
        };

        if (playerIn || samePositionPlayers.length > 0) {
            fetchAllFixtures();
        }
    }, [playerIn, samePositionPlayers, getFixturesForTeam]);


    const renderFixtureCell = (teamId, offsetGW) => {
        const currentGwId = (nextGameweek?.id || 0) + offsetGW;
        const teamFixtures = allFixtures[teamId];
        const fixture = teamFixtures?.[currentGwId];

        if (!fixture) {
            return <td key={offsetGW} className={Style.hideOnMobile}>-</td>;
        }

        const match = fixture.opponent.match(/^(.*)\s\((H|A)\)$/);
        const fullName = match ? match[1].trim() : fixture.opponent;
        const ha = match ? match[2] : "";
        const shortName = TeamShortNames[fullName] || fullName;

        return (
            <td key={offsetGW} className={Style.hideOnMobile}>
                {shortName} ({ha})
            </td>
        );
    };

    const handleReplace = async (playerOut) => {
        setSaving(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/api/market/transfer`, {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    playerOutId: playerOut.id,
                    playerInId: playerIn.id
                })
            });
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Transfer failed");
            }

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
            onClose();
        } catch (requestError) {
            setError(requestError.message || "Transfer failed on server");
        } finally {
            setSaving(false);
        }
    };


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

    return (
        <div className={Style.overlay}>
            <div className={Style.modal} role="dialog" aria-modal="true" aria-label="Select player to replace">
                <h3>
                    You have requested to sign{" "}
                    <span className={Style.green}>{playerIn.viewName}</span>.
                </h3>

                <div className={Style.section}>
                    <div className={Style.tableWrapper}>
                        <table className={Style.table}>
                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Points</th>
                                    <th className={Style.hideOnMobile}>GW{nextGameweek?.id || "Next"}</th>
                                    <th className={Style.hideOnMobile}>GW{(nextGameweek?.id || 0) + 1}</th>
                                    <th className={Style.hideOnMobile}>GW{(nextGameweek?.id || 0) + 2}</th>
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

                                    {renderFixtureCell(playerIn.teamId, 0)}
                                    {renderFixtureCell(playerIn.teamId, 1)}
                                    {renderFixtureCell(playerIn.teamId, 2)}

                                    <td>
                                        <button className={Style.cancelBtnSmall} onClick={onClose}>
                                            Cancel
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <h4 className={Style.subtitle}>
                    Which player would you like{" "}
                    <span className={Style.green}>{playerIn.viewName}</span> to replace?
                </h4>

                {error && <p role="alert">{error}</p>}

                <div className={Style.section}>
                    <div className={Style.tableWrapper}>
                        <table className={Style.table}>
                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Points</th>
                                    <th className={Style.hideOnMobile}>GW{nextGameweek?.id || "Next"}</th>
                                    <th className={Style.hideOnMobile}>GW{(nextGameweek?.id || 0) + 1}</th>
                                    <th className={Style.hideOnMobile}>GW{(nextGameweek?.id || 0) + 2}</th>
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

                                            {renderFixtureCell(p.teamId, 0)}
                                            {renderFixtureCell(p.teamId, 1)}
                                            {renderFixtureCell(p.teamId, 2)}

                                            <td>
                                                <button
                                                    className={Style.replaceBtn}
                                                    onClick={() => handleReplace(p)}
                                                    disabled={saving}
                                                >
                                                    {saving ? "Saving..." : "Replace"}
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
                </div>

                <button className={Style.closeBtn} onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}

export default ReplacementModal;
