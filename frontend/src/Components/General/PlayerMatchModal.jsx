import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";

import { useTeamsContext } from "../../Context/TeamsContext";
import { usePlayerMatchStats } from "../../features/players/usePlayerDetails";
import Style from "../../Styles/PlayerModal.module.css";
import TeamLogo from "../Pages/FixturesTab/TeamLogo";

function PlayerMatchModal({ player, onClose, gameweek, user, onViewInfo }) {
    const { teamsById } = useTeamsContext();
    const matchQuery = usePlayerMatchStats(player?.id, gameweek?.id, user?.id);
    const matchData = matchQuery.data;

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className={Style.overlay} />
                <Dialog.Content className={Style.modal}>
                    <Dialog.Title className="sr-only">Match points for {player?.viewName || "player"}</Dialog.Title>
                    <Dialog.Description className="sr-only">A detailed points breakdown for the selected gameweek fixture.</Dialog.Description>
                    <Dialog.Close asChild>
                        <button type="button" className={Style.closeBtn} aria-label="Close match points">✕</button>
                    </Dialog.Close>

                    {matchQuery.isPending ? (
                        <p role="status">Loading match points…</p>
                    ) : matchQuery.error || !matchData ? (
                        <p role="alert">{matchQuery.error?.message || "Match points are temporarily unavailable."}</p>
                    ) : (
                        <PlayerMatchContent
                            matchData={matchData}
                            player={player}
                            teamsById={teamsById}
                            onViewInfo={onViewInfo}
                        />
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function PlayerMatchContent({ matchData, player, teamsById, onViewInfo }) {
    const homeTeam = teamsById.get(String(matchData.homeTeamId));
    const awayTeam = teamsById.get(String(matchData.awayTeamId));
    const stats = matchData.stats ?? [];
    const totalLine = stats.find((stat) => stat.name === "Total");
    const baseTotal = totalLine?.points ?? 0;
    const finalTotal = matchData.captain ? baseTotal * 2 : baseTotal;
    const matchPlayed = matchData.homeScore !== null && matchData.homeScore !== undefined;
    const hasPlayerStats = stats.some((stat) => stat.value > 0 || stat.points !== 0);

    return (
        <>
            <h2 className={Style.playerName}>{matchData.playerName}</h2>
            <div className={Style.fixtureHeader}>
                <span className={Style.team}>{homeTeam?.shortName || homeTeam?.name || "TBD"}</span>
                <TeamLogo team={homeTeam} />
                <span className={Style.score}>
                    {matchData.homeScore != null
                        ? `${matchData.homeScore} - ${matchData.awayScore}`
                        : `${homeTeam?.shortName || homeTeam?.name || "TBD"} - ${awayTeam?.shortName || awayTeam?.name || "TBD"}`}
                </span>
                <TeamLogo team={awayTeam} />
                <span className={Style.team}>{awayTeam?.shortName || awayTeam?.name || "TBD"}</span>
            </div>

            <table className={Style.statsTable}>
                <caption className="sr-only">Points breakdown for this match</caption>
                <thead><tr><th scope="col">Statistic</th><th scope="col">Value</th><th scope="col">Pts</th></tr></thead>
                <tbody>
                    {!hasPlayerStats ? (
                        <>
                            <tr><td colSpan="3" className={Style.noDataRow}>{matchPlayed ? "Player did not play in this match." : "Fixture has not started yet."}</td></tr>
                            <TotalRow total={0} />
                        </>
                    ) : (
                        <>
                            {stats.filter((stat) => stat.points !== 0 && stat.name !== "Total").map((stat) => (
                                <tr key={stat.name}>
                                    <td className={Style.statNameCell}>
                                        <div className={Style.statCellContent}>
                                            {stat.iconPath && <Image src={stat.iconPath} alt="" width={20} height={20} className={Style.statIcon} />}
                                            <span>{stat.name}</span>
                                        </div>
                                    </td>
                                    <td>{stat.value}</td><td>{stat.points}</td>
                                </tr>
                            ))}
                            {matchData.captain && (
                                <tr className={Style.captainRow}>
                                    <td><div className={Style.statCellContent}><Image src="/Icons/captain.svg" alt="" width={20} height={20} className={Style.statIcon} /><span>Captain bonus</span></div></td>
                                    <td>x2</td><td />
                                </tr>
                            )}
                            <TotalRow total={finalTotal} />
                        </>
                    )}
                </tbody>
            </table>

            <button type="button" className={Style.infoBtn} onClick={() => onViewInfo(player)}>
                View Information
            </button>
        </>
    );
}

function TotalRow({ total }) {
    return (
        <tr className={Style.totalRow}>
            <td><div className={Style.statCellContent}><Image src="/Icons/total.svg" alt="" width={20} height={20} className={Style.statIcon} /><strong>Total</strong></div></td>
            <td /><td><strong>{total}</strong></td>
        </tr>
    );
}

export default PlayerMatchModal;
