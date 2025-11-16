import { useEffect, useState } from "react";
import Style from "../../Styles/PlayerModal.module.css";
import TeamLogo from "../Pages/FixturesTab/TeamLogo";
import API_URL from "../../config";
import { useTeams } from "../../Context/TeamsContext";
import { useRef } from "react";

function PlayerMatchModal({ player, onClose, gameweek, user, onViewInfo }) {
    const [matchData, setMatchData] = useState(null);
    const matchCache = useRef({});
    const { teams } = useTeams();

    useEffect(() => {
        if (player && gameweek && user) {
            const cacheKey = `${player.id}_${gameweek.id}`;
            if (matchCache.current[cacheKey]) {
                setMatchData(matchCache.current[cacheKey]);
                return;
            }

            fetch(`${API_URL}/api/players/${player.id}/match-stats?gw=${gameweek.id}&userId=${user.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        matchCache.current[cacheKey] = data;
                        setMatchData(data);
                    }
                })
                .catch(err => console.error("Failed to fetch player match data:", err));
        }
    }, [player, gameweek, user]);

    if (!matchData || !teams.length) return null;

    const homeTeam = teams.find(t => t.id === matchData.homeTeamId);
    const awayTeam = teams.find(t => t.id === matchData.awayTeamId);

    const hasStats = matchData.stats && matchData.stats.length > 0;
    const totalLine = hasStats ? matchData.stats.find(s => s.name === "Total") : null;
    const baseTotal = totalLine ? totalLine.points : 0;
    const finalTotal = matchData.captain ? baseTotal * 2 : baseTotal;

    const noMatchPlayed =
        !hasStats ||
        (matchData.stats.length === 1 && matchData.stats[0].name === "Total" && matchData.stats[0].points === 0);

    return (
        <div className={Style.overlay}>
            <div className={Style.modal}>
                <button className={Style.closeBtn} onClick={onClose}>✕</button>

                <h2 className={Style.playerName}>{matchData.playerName}</h2>

                <div className={Style.fixtureHeader}>
                    <span className={Style.team}>{homeTeam?.shortName || homeTeam?.name || "TBD"}</span>
                    <TeamLogo teamId={homeTeam?.id} />
                    <span className={Style.score}>
                        {matchData.homeScore != null
                            ? `${matchData.homeScore} - ${matchData.awayScore}`
                            : `${homeTeam?.shortName || homeTeam?.name} - ${awayTeam?.shortName || awayTeam?.name}`}
                    </span>
                    <TeamLogo teamId={awayTeam?.id} />
                    <span className={Style.team}>{awayTeam?.shortName || awayTeam?.name || "TBD"}</span>
                </div>

                <table className={Style.statsTable}>
                    <thead>
                        <tr>
                            <th>Statistic</th>
                            <th>Value</th>
                            <th>Pts</th>
                        </tr>
                    </thead>
                    <tbody>
                        {noMatchPlayed ? (
                            <>
                                <tr>
                                    <td>
                                        <div className={Style.statCellContent}>
                                            <img
                                                src="/Icons/stopwatch.svg"
                                                alt="Minutes played"
                                                className={Style.statIcon}
                                            />
                                            <span>Minutes played</span>
                                        </div>
                                    </td>
                                    <td>0</td>
                                    <td>0</td>
                                </tr>
                                <tr className={Style.totalRow}>
                                    <td>
                                        <div className={Style.statCellContent}>
                                            <img
                                                src="/Icons/total.svg"
                                                alt="Total"
                                                className={Style.statIcon}
                                            />
                                            <strong>Total</strong>
                                        </div>
                                    </td>
                                    <td></td>
                                    <td><strong>0</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan="3" className={Style.noDataRow}>
                                        No data available for this fixture yet.
                                    </td>
                                </tr>
                            </>
                        ) : (
                            <>
                                {matchData.stats
                                    .filter((s) => s.points !== 0 && s.name !== "Total")
                                    .map((s, i) => (
                                        <tr key={i}>
                                            <td className={Style.statNameCell}>
                                                <div className={Style.statCellContent}>
                                                    {s.iconPath && (
                                                        <img
                                                            src={s.iconPath}
                                                            alt={s.name}
                                                            className={Style.statIcon}
                                                        />
                                                    )}
                                                    <span>{s.name}</span>
                                                </div>
                                            </td>
                                            <td>{s.value}</td>
                                            <td>{s.points}</td>
                                        </tr>
                                    ))}

                                {matchData.captain && (
                                    <tr className={Style.captainRow}>
                                        <td>
                                            <div className={Style.statCellContent}>
                                                <img
                                                    src="/Icons/captain.svg"
                                                    alt="Captain bonus"
                                                    className={Style.statIcon}
                                                />
                                                <span>Captain bonus</span>
                                            </div>
                                        </td>
                                        <td>x2</td>
                                        <td></td>
                                    </tr>
                                )}

                                <tr className={Style.totalRow}>
                                    <td>
                                        <div className={Style.statCellContent}>
                                            <img
                                                src="/Icons/total.svg"
                                                alt="Total"
                                                className={Style.statIcon}
                                            />
                                            <strong>Total</strong>
                                        </div>
                                    </td>
                                    <td></td>
                                    <td><strong>{finalTotal}</strong></td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>

                <button className={Style.infoBtn} onClick={() => onViewInfo(player)}>
                    View Information
                </button>
            </div>
        </div>
    );
}

export default PlayerMatchModal;
