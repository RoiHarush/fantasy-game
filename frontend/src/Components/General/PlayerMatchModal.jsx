import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, Info, Trophy } from "@/src/shared/ui/icons";
import Image from "next/image";

import { useTeamsContext } from "../../Context/TeamsContext";
import { usePlayerMatchStats } from "../../features/players/usePlayerDetails";
import { Button } from "../../shared/ui/Button";
import CloseButton from "../../shared/ui/CloseButton";
import { ResponsiveDialogSurface } from "../../shared/ui/ResponsiveDialog";
import TeamLogo from "../Pages/FixturesTab/TeamLogo";

function PlayerMatchModal({ player, onClose, gameweek, user, onViewInfo, previewData = null }) {
    const { teamsById } = useTeamsContext();
    const matchQuery = usePlayerMatchStats(
        previewData ? null : player?.id,
        previewData ? null : gameweek?.id,
        previewData ? null : user?.id,
    );
    const matchData = previewData ?? matchQuery.data;
    const pending = !previewData && matchQuery.isPending;
    const error = !previewData && matchQuery.error;

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface className="sm:w-[min(calc(100vw-2rem),42rem)]">
                <Dialog.Title className="sr-only">Match points for {player?.viewName || "player"}</Dialog.Title>
                <Dialog.Description className="sr-only">Detailed gameweek scoring, separated by fixture.</Dialog.Description>
                <Dialog.Close asChild>
                    <CloseButton className="absolute right-3 top-4 z-10" aria-label="Close match points" />
                </Dialog.Close>

                {pending ? (
                    <DialogStatus>Loading match points…</DialogStatus>
                ) : error || !matchData ? (
                    <DialogStatus tone="error">{error?.message || "Match points are temporarily unavailable."}</DialogStatus>
                ) : (
                    <PlayerMatchContent
                        matchData={matchData}
                        player={player}
                        teamsById={teamsById}
                        onViewInfo={onViewInfo}
                    />
                )}
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

export function PlayerMatchContent({ matchData, player, teamsById, onViewInfo }) {
    const fixtureMatches = matchData.fixtures?.length > 0 ? matchData.fixtures : [matchData];
    const isDoubleGameweek = fixtureMatches.length > 1;
    const aggregateTotal = findTotalLine(matchData.stats);
    const baseTotal = aggregateTotal?.points ?? fixtureMatches.reduce((sum, match) => sum + getMatchTotalPoints(match), 0);
    const captainMultiplier = matchData.captainMultiplier ?? (matchData.captain ? 2 : 1);
    const finalTotal = baseTotal * captainMultiplier;

    return (
        <div className="flex max-h-[calc(92dvh-0.75rem)] flex-col">
            <header className="shrink-0 bg-component-gradient px-5 pb-5 pt-4 text-brand-ink sm:px-7 sm:pb-6">
                <div className="flex items-center gap-2 pr-12 text-[0.65rem] font-black uppercase tracking-[0.15em] opacity-70">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    Gameweek {matchData.gameweekId ?? "points"}
                </div>
                <div className="mt-2 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{matchData.playerName || player?.viewName}</h2>
                        <p className="mt-1 text-xs font-bold opacity-70 sm:text-sm">
                            {isDoubleGameweek ? `${fixtureMatches.length} fixtures in this Gameweek` : "Fixture contribution"}
                        </p>
                    </div>
                    <div className="mr-12 shrink-0 text-right">
                        <strong className="block text-3xl font-black leading-none tabular-nums sm:text-4xl">{finalTotal}</strong>
                        <span className="text-[0.65rem] font-black uppercase tracking-wider opacity-65">points</span>
                    </div>
                </div>
            </header>

            {isDoubleGameweek && (
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-app-accent-border bg-app-accent-surface px-4 py-2.5 text-app-accent-foreground sm:px-6">
                    <span className="flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.12em]"><Trophy className="size-4" aria-hidden="true" /> Multiple fixtures</span>
                    <strong className="text-sm tabular-nums">
                        {fixtureMatches.map((match) => getMatchTotalPoints(match) * captainMultiplier).join(" + ")} = {finalTotal}
                    </strong>
                </div>
            )}

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-5">
                {fixtureMatches.map((fixture, index) => (
                    <FixturePointsCard
                        key={fixture.fixtureId ?? index}
                        fixture={fixture}
                        fixtureNumber={isDoubleGameweek ? index + 1 : null}
                        teamsById={teamsById}
                        captainMultiplier={captainMultiplier}
                    />
                ))}

                {captainMultiplier > 1 && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-app-accent-border bg-app-accent-surface px-4 py-3 text-sm text-app-accent-foreground">
                        <span className="flex items-center gap-2 font-bold">
                            <Image src="/Icons/captain.svg" alt="" width={20} height={20} className="size-5 object-contain" />
                            Captain multiplier
                        </span>
                        <strong className="text-lg">×{captainMultiplier}</strong>
                    </div>
                )}
            </div>

            <footer className="grid shrink-0 gap-2 border-t border-app-border bg-app-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:grid-cols-2 sm:px-5 sm:pb-4">
                {onViewInfo && (
                    <Button variant="secondary" className="border-app-border bg-app-surface text-app-foreground hover:bg-app-surface-muted" onClick={() => onViewInfo(player)}>
                        <Info className="size-4" aria-hidden="true" /> View player information
                    </Button>
                )}
                <Dialog.Close asChild>
                    <Button className={onViewInfo ? "" : "sm:col-span-2"}>Done</Button>
                </Dialog.Close>
            </footer>
        </div>
    );
}

function FixturePointsCard({ fixture, fixtureNumber, teamsById, captainMultiplier }) {
    const homeTeam = teamsById?.get?.(String(fixture.homeTeamId)) ?? {
        id: fixture.homeTeamId,
        name: fixture.homeTeamName || "Home",
        shortName: fixture.homeTeamName,
    };
    const awayTeam = teamsById?.get?.(String(fixture.awayTeamId)) ?? {
        id: fixture.awayTeamId,
        name: fixture.awayTeamName || "Away",
        shortName: fixture.awayTeamName,
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
            {fixtureNumber && (
                <p className="border-b border-app-border bg-app-surface-muted px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-app-muted sm:px-4">
                    Fixture {fixtureNumber}
                </p>
            )}
            <FixtureHeader fixture={fixture} homeTeam={homeTeam} awayTeam={awayTeam} />
            <StatsBreakdownTable stats={fixture.stats ?? []} matchData={fixture} captainMultiplier={captainMultiplier} />
        </section>
    );
}

function FixtureHeader({ fixture, homeTeam, awayTeam }) {
    const score = fixture.homeScore != null && fixture.awayScore != null
        ? `${fixture.homeScore} – ${fixture.awayScore}`
        : "vs";

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-app-border px-3 py-3 sm:px-4">
            <div className="flex min-w-0 items-center justify-end gap-2">
                <span className="truncate text-right text-xs font-black sm:text-sm">{homeTeam.shortName || homeTeam.name}</span>
                <TeamLogo team={homeTeam} />
            </div>
            <span className="min-w-12 rounded-lg bg-brand-ink px-2 py-1 text-center text-xs font-black text-white sm:text-sm">{score}</span>
            <div className="flex min-w-0 items-center gap-2">
                <TeamLogo team={awayTeam} />
                <span className="truncate text-xs font-black sm:text-sm">{awayTeam.shortName || awayTeam.name}</span>
            </div>
        </div>
    );
}

function StatsBreakdownTable({ stats, matchData, captainMultiplier = 1 }) {
    const matchPlayed = matchData.homeScore !== null && matchData.homeScore !== undefined;
    const statRows = stats.filter((stat) => stat.name !== "Total" && stat.points !== 0);
    const hasPlayerStats = statRows.length > 0 || getTotalPoints(stats) !== 0;
    const baseTotal = getTotalPoints(stats);
    const contributionTotal = baseTotal * captainMultiplier;

    return (
        <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
            <caption className="sr-only">Points breakdown for this fixture</caption>
            <thead className="bg-app-surface-muted text-[0.6rem] font-black uppercase tracking-[0.1em] text-app-muted sm:text-[0.68rem]">
                <tr><th scope="col" className="w-[64%] px-3 py-2 text-left sm:px-4">Statistic</th><th scope="col" className="w-[18%] px-1 py-2 text-center">Value</th><th scope="col" className="w-[18%] px-3 py-2 text-right sm:px-4">Pts</th></tr>
            </thead>
            <tbody>
                {!hasPlayerStats ? (
                    <>
                        <tr><td colSpan="3" className="px-4 py-6 text-center text-xs text-app-muted sm:text-sm">{matchPlayed ? "Player did not play in this fixture." : "Fixture has not started yet."}</td></tr>
                        <TotalRow total={0} />
                    </>
                ) : (
                    <>
                        {statRows.map((stat) => (
                            <tr key={stat.name} className="border-t border-app-border first:border-t-0">
                                <td className="px-3 py-2.5 sm:px-4">
                                    <div className="flex min-w-0 items-center gap-2">
                                        {stat.iconPath && (
                                            <Image
                                                src={stat.iconPath}
                                                alt=""
                                                width={20}
                                                height={20}
                                                className={`size-4 shrink-0 object-contain sm:size-5 ${isSemanticStatIcon(stat.iconPath)
                                                    ? "saturate-125 contrast-110 dark:brightness-110"
                                                    : "dark:invert dark:brightness-125 dark:contrast-125"
                                                }`}
                                            />
                                        )}
                                        <span className="truncate font-semibold">{stat.name}</span>
                                    </div>
                                </td>
                                <td className="px-1 py-2.5 text-center tabular-nums text-app-muted">{stat.value}</td>
                                <td className="px-3 py-2.5 text-right font-bold tabular-nums sm:px-4">{stat.points}</td>
                            </tr>
                        ))}
                        {captainMultiplier > 1 && (
                            <tr className="border-t border-app-accent-border bg-app-accent-surface text-app-accent-foreground">
                                <td className="px-3 py-2.5 sm:px-4"><div className="flex items-center gap-2"><Image src="/Icons/captain.svg" alt="" width={20} height={20} className="size-4 object-contain sm:size-5" /><strong>Captain contribution</strong></div></td>
                                <td className="px-1 py-2.5 text-center font-bold">×{captainMultiplier}</td>
                                <td className="px-3 py-2.5 text-right font-black tabular-nums sm:px-4">{contributionTotal}</td>
                            </tr>
                        )}
                        <TotalRow total={contributionTotal} />
                    </>
                )}
            </tbody>
        </table>
    );
}

function TotalRow({ total }) {
    return (
        <tr className="border-t border-app-border bg-app-surface-muted font-black">
            <td className="px-3 py-3 sm:px-4"><div className="flex items-center gap-2"><Image src="/Icons/total.svg" alt="" width={20} height={20} className="size-4 object-contain dark:invert dark:brightness-125 sm:size-5" />Fixture total</div></td>
            <td />
            <td className="px-3 py-3 text-right text-base tabular-nums text-app-accent-foreground sm:px-4">{total}</td>
        </tr>
    );
}

function DialogStatus({ children, tone = "neutral" }) {
    return (
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-7">
            <p role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-8 text-center text-sm ${tone === "error" ? "border-red-400/40 bg-red-500/10 text-red-700 dark:text-red-300" : "border-app-border bg-app-surface-muted text-app-muted"}`}>
                {children}
            </p>
        </div>
    );
}

function findTotalLine(stats = []) {
    return stats.find((stat) => stat.name === "Total");
}

function getTotalPoints(stats = []) {
    return findTotalLine(stats)?.points ?? 0;
}

function getMatchTotalPoints(match) {
    return getTotalPoints(match.stats);
}

function isSemanticStatIcon(iconPath = "") {
    return [
        "goal-conceded.svg",
        "own-goal.svg",
        "penalty-missed.svg",
        "forward-bonus.svg",
        "yellow-card.svg",
        "red-card.svg",
    ].some((fileName) => iconPath.endsWith(fileName));
}

export default PlayerMatchModal;
