import Style from "../../Styles/PlayerModal.module.css";
import TeamLogo from "../Pages/FixturesTab/TeamLogo";
import { useTeams } from "../../features/teams/useTeams";
import { usePlayerMatchStats } from "../../features/players/usePlayerDetails";

function PlayerMatchModal({ player, onClose, gameweek, user, onViewInfo }) {
    const { teams } = useTeams();
    const matchQuery = usePlayerMatchStats(player?.id, gameweek?.id, user?.id);
    const matchData = matchQuery.data;

    if (!matchData || !teams.length) return null;

    const homeTeam = teams.find(t => t.id === matchData.homeTeamId);
    const awayTeam = teams.find(t => t.id === matchData.awayTeamId);

    const hasStats = matchData.stats && matchData.stats.length > 0;
    const totalLine = hasStats ? matchData.stats.find(s => s.name === "Total") : null;
    const baseTotal = totalLine ? totalLine.points : 0;
    const finalTotal = matchData.captain ? baseTotal * 2 : baseTotal;

    const matchPlayed = matchData.homeScore !== null && matchData.homeScore !== undefined;

    const hasPlayerStats = matchData.stats && matchData.stats.length > 0 && matchData.stats.some(s => s.value > 0 || s.points !== 0);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={Style.overlay} onClick={handleOverlayClick}>
            <div className={Style.modal} onClick={(e) => e.stopPropagation()}>
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
                        {!hasPlayerStats ? (
                            <>
                                <tr>
                                    <td colSpan="3" className={Style.noDataRow}>
                                        {matchPlayed
                                            ? "Player did not play in this match."
                                            : "Fixture has not started yet."}
                                    </td>
                                </tr>
                                <tr className={Style.totalRow}>
                                    <td>
                                        <div className={Style.statCellContent}>
                                            <img src="/Icons/total.svg" alt="Total" className={Style.statIcon} />
                                            <strong>Total</strong>
                                        </div>
                                    </td>
                                    <td></td>
                                    <td><strong>0</strong></td>
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
