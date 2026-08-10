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
    const fixtureMatches = matchData.fixtures?.length > 0 ? matchData.fixtures : [matchData];
    const isDoubleGameweek = fixtureMatches.length > 1;
    const baseTotal = getTotalPoints(matchData.stats);
    const captainMultiplier = matchData.captainMultiplier ?? (matchData.captain ? 2 : 1);
    const finalTotal = baseTotal * captainMultiplier;

    return (
        <>
            <h2 className={Style.playerName}>{matchData.playerName}</h2>
            {isDoubleGameweek && (
                <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-xl border border-app-accent-border bg-app-accent-surface px-3 py-2 text-app-accent-foreground sm:mx-5">
                    <span className="text-xs font-black uppercase tracking-[0.12em]">Double Gameweek</span>
                    <strong className="text-sm">
                        {fixtureMatches.map((match) => getMatchTotalPoints(match) * captainMultiplier).join(" + ")} = {finalTotal} pts
                    </strong>
                </div>
            )}

            <div className={isDoubleGameweek ? "grid max-h-[62vh] gap-3 overflow-y-auto px-3 pb-2 sm:px-5" : ""}>
                {fixtureMatches.map((fixture, index) => (
                    <section key={fixture.fixtureId ?? index} className={isDoubleGameweek ? "overflow-hidden rounded-xl border border-app-border bg-app-surface" : ""}>
                        {isDoubleGameweek && <p className="px-3 pt-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-app-muted">Match {index + 1}</p>}
                        <FixtureHeader matchData={fixture} teamsById={teamsById} />
                        <StatsBreakdownTable
                            stats={fixture.stats ?? []}
                            matchData={fixture}
                            captainMultiplier={captainMultiplier}
                        />
                    </section>
                ))}
            </div>

            {(isDoubleGameweek || captainMultiplier > 1) && (
                <div className="mx-3 mt-3 overflow-hidden rounded-xl border border-app-accent-border bg-app-accent-surface sm:mx-5">
                    {captainMultiplier > 1 && (
                        <div className="flex items-center justify-between gap-3 border-b border-app-accent-border px-3 py-2 text-sm font-bold text-app-accent-foreground">
                            <span className="flex items-center gap-2"><Image src="/Icons/captain.svg" alt="" width={20} height={20} className={Style.statIcon} />Captain multiplier</span>
                            <strong>×{captainMultiplier}</strong>
                        </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-2.5 text-app-foreground">
                        <strong>Gameweek total</strong>
                        <strong className="text-lg">{finalTotal} pts</strong>
                    </div>
                </div>
            )}

            <button type="button" className={Style.infoBtn} onClick={() => onViewInfo(player)}>
                View Information
            </button>
        </>
    );
}

function FixtureHeader({ matchData, teamsById }) {
    const homeTeam = teamsById.get(String(matchData.homeTeamId));
    const awayTeam = teamsById.get(String(matchData.awayTeamId));
    return (
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
    );
}

function StatsBreakdownTable({ stats, matchData, captainMultiplier = 1 }) {
    const matchPlayed = matchData.homeScore !== null && matchData.homeScore !== undefined;
    const hasPlayerStats = stats.some((stat) => Number(stat.value) > 0 || stat.points !== 0);
    const baseTotal = getTotalPoints(stats);
    const contributionTotal = baseTotal * captainMultiplier;
    return (
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
                        {captainMultiplier > 1 && (
                            <tr className="text-app-accent-foreground">
                                <td className={Style.statNameCell}>
                                    <div className={Style.statCellContent}>
                                        <Image src="/Icons/captain.svg" alt="" width={20} height={20} className={Style.statIcon} />
                                        <strong>Captain contribution</strong>
                                    </div>
                                </td>
                                <td>×{captainMultiplier}</td>
                                <td><strong>{contributionTotal}</strong></td>
                            </tr>
                        )}
                        <TotalRow total={contributionTotal} />
                    </>
                )}
            </tbody>
        </table>
    );
}

function getTotalPoints(stats = []) {
    return stats.find((stat) => stat.name === "Total")?.points ?? 0;
}

function getMatchTotalPoints(match) {
    return getTotalPoints(match.stats);
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
