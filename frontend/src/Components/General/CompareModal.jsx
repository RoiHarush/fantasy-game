import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useState } from "react";

import { useTeamsContext } from "../../Context/TeamsContext";
import { useTeamFixtures } from "../../features/fixtures/useFixtures";
import { getFixtureItems } from "../../features/fixtures/model";
import { useGameweek } from "../../features/gameweeks/useGameweek";
import { usePlayerStats } from "../../features/players/usePlayerDetails";
import { buildPlayerStatRow, buildPlayerStatTotals } from "../../features/players/statsModel";
import { ResponsiveDialogSurface } from "../../shared/ui/ResponsiveDialog";
import TeamLogo from "../Pages/FixturesTab/TeamLogo";
import PlayerInfoContent from "./PlayerInfoContent";
import Switcher from "./Switcher";
import ImageWithFallback from "../../shared/ui/ImageWithFallback";

function CompareModal({ players, onClose }) {
    const [tab, setTab] = useState("fixtures");
    const [left, right] = players;
    const leftFixturesQuery = useTeamFixtures(left?.teamId);
    const rightFixturesQuery = useTeamFixtures(right?.teamId);
    const leftStatsQuery = usePlayerStats(left?.id);
    const rightStatsQuery = usePlayerStats(right?.id);
    const { teamsById } = useTeamsContext();
    const { currentGameweek, nextGameweek } = useGameweek();

    if (!left || !right) return null;

    const activeQueries = tab === "fixtures"
        ? [leftFixturesQuery, rightFixturesQuery]
        : [leftStatsQuery, rightStatsQuery];
    const isPending = activeQueries.some((query) => query.isPending);
    const error = activeQueries.find((query) => query.error)?.error;
    const fixtureBoundary = currentGameweek?.id ?? Math.max(0, (nextGameweek?.id ?? 1) - 1);

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <ResponsiveDialogSurface className="flex h-[min(92dvh,48rem)] flex-col sm:h-[min(90vh,56rem)] sm:w-[min(calc(100vw-2rem),64rem)]">
                    <Dialog.Title className="sr-only">Compare {left.viewName} and {right.viewName}</Dialog.Title>
                    <Dialog.Description className="sr-only">Side-by-side fixtures and statistics for two players.</Dialog.Description>

                    <Dialog.Close asChild>
                        <button
                            type="button"
                            className="absolute top-3 right-3 z-20 grid size-10 place-items-center rounded-full border border-white/45 bg-white/25 text-brand-ink shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:top-4 sm:right-4"
                            aria-label="Close comparison"
                        >
                            <X aria-hidden="true" size={21} />
                        </button>
                    </Dialog.Close>

                    <header className="relative grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-1 bg-component-gradient px-2 pt-11 text-brand-on-gradient sm:gap-6 sm:px-8 sm:pt-5">
                        <PlayerComparisonHeader player={left} team={teamsById.get(String(left.teamId))} />
                        <div className="mb-5 rounded-full border border-white/40 bg-brand-ink/80 px-2.5 py-1 text-sm font-black tracking-wider text-white shadow-lg sm:mb-10 sm:px-4 sm:py-2 sm:text-2xl">
                            VS
                        </div>
                        <PlayerComparisonHeader player={right} team={teamsById.get(String(right.teamId))} reverse />
                    </header>

                    <div className="shrink-0 border-b border-app-border bg-app-surface px-3 py-3 sm:px-5">
                        <Switcher active={tab} options={["fixtures", "stats"]} onChange={setTab} />
                    </div>

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-app-surface-muted p-2 sm:p-4">
                        {isPending ? (
                            <p className="rounded-xl border border-app-border bg-app-surface p-6 text-center text-sm text-app-muted" role="status">
                                Loading comparison…
                            </p>
                        ) : error ? (
                            <p className="rounded-xl border border-app-danger-border bg-app-danger-surface p-4 text-sm text-app-danger-foreground" role="alert">
                                {error.message || "The comparison is temporarily unavailable."}
                            </p>
                        ) : (
                            <>
                                <div className="md:hidden">
                                    <MobileComparison
                                        tab={tab}
                                        left={left}
                                        right={right}
                                        leftFixtures={leftFixturesQuery.data ?? {}}
                                        rightFixtures={rightFixturesQuery.data ?? {}}
                                        leftStats={leftStatsQuery.data ?? []}
                                        rightStats={rightStatsQuery.data ?? []}
                                        fixtureBoundary={fixtureBoundary}
                                    />
                                </div>
                                <div className="hidden min-w-0 grid-cols-2 gap-4 overflow-hidden md:grid">
                                <ComparisonSide
                                    tab={tab}
                                    teamFixtures={leftFixturesQuery.data ?? {}}
                                    matchStats={leftStatsQuery.data ?? []}
                                    fixtureBoundary={fixtureBoundary}
                                    playerName={left.viewName}
                                />
                                <ComparisonSide
                                    tab={tab}
                                    teamFixtures={rightFixturesQuery.data ?? {}}
                                    matchStats={rightStatsQuery.data ?? []}
                                    fixtureBoundary={fixtureBoundary}
                                    playerName={right.viewName}
                                />
                                </div>
                            </>
                        )}
                    </div>
            </ResponsiveDialogSurface>
        </Dialog.Root>
    );
}

function ComparisonSide({ tab, teamFixtures, matchStats, fixtureBoundary, playerName }) {
    return (
        <section className="min-w-0 max-w-full overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-sm" style={{ minWidth: 0, maxWidth: "100%" }} aria-label={`${playerName} ${tab}`}>
            <PlayerInfoContent
                tab={tab}
                teamFixtures={teamFixtures}
                matchStats={matchStats}
                fixtureBoundary={fixtureBoundary}
            />
        </section>
    );
}

const MOBILE_STAT_ROWS = [
    ["points", "Points"],
    ["minutes", "Minutes"],
    ["goals", "Goals"],
    ["assists", "Assists"],
    ["cleanSheets", "Clean sheets"],
    ["goalsConceded", "Goals conceded"],
    ["yellowCards", "Yellow cards"],
    ["redCards", "Red cards"],
];

function MobileComparison({
    tab,
    left,
    right,
    leftFixtures,
    rightFixtures,
    leftStats,
    rightStats,
    fixtureBoundary,
}) {
    if (tab === "stats") {
        const leftRows = leftStats.map((match) => buildPlayerStatRow(match, leftFixtures));
        const rightRows = rightStats.map((match) => buildPlayerStatRow(match, rightFixtures));
        const leftTotals = buildPlayerStatTotals(leftRows);
        const rightTotals = buildPlayerStatTotals(rightRows);

        return (
            <section className="overflow-hidden rounded-xl border border-app-border bg-app-surface" aria-label="Player statistics comparison">
                <ComparisonHeader left={left.viewName} middle="Stat" right={right.viewName} wideMiddle />
                {MOBILE_STAT_ROWS.map(([field, label]) => (
                    <div
                        key={field}
                        className="grid items-center border-b border-app-border px-2 py-1.5 text-center last:border-b-0"
                        style={{ gridTemplateColumns: "minmax(0, 1fr) 5.5rem minmax(0, 1fr)" }}
                    >
                        <strong className="text-[0.95rem] text-app-foreground">{leftTotals[field]}</strong>
                        <span className="text-[0.68rem] font-bold uppercase tracking-wide text-app-muted">{label}</span>
                        <strong className="text-[0.95rem] text-app-foreground">{rightTotals[field]}</strong>
                    </div>
                ))}
            </section>
        );
    }

    const gameweeks = Array.from(new Set([
        ...Object.keys(leftFixtures),
        ...Object.keys(rightFixtures),
    ].map(Number)))
        .filter((gameweek) => gameweek > fixtureBoundary)
        .sort((first, second) => first - second);

    return (
        <section className="overflow-hidden rounded-xl border border-app-border bg-app-surface" aria-label="Player fixtures comparison">
            <ComparisonHeader left={left.viewName} middle="GW" right={right.viewName} />
            {gameweeks.map((gameweek) => (
                <div
                    key={gameweek}
                    className="grid items-center border-b border-app-border last:border-b-0"
                    style={{ gridTemplateColumns: "minmax(0, 1fr) 1.75rem minmax(0, 1fr)" }}
                >
                    <MobileFixture fixture={leftFixtures[gameweek] ?? leftFixtures[String(gameweek)]} />
                    <strong className="text-center text-[0.7rem] text-app-muted">{gameweek}</strong>
                    <MobileFixture fixture={rightFixtures[gameweek] ?? rightFixtures[String(gameweek)]} reverse />
                </div>
            ))}
            {gameweeks.length === 0 && <p className="p-5 text-center text-sm text-app-muted">No upcoming fixtures.</p>}
        </section>
    );
}

function ComparisonHeader({ left, middle, right, wideMiddle = false }) {
    return (
        <div
            className="grid items-center bg-app-surface-muted px-2 py-2 text-[0.6rem] font-extrabold uppercase tracking-wide text-app-muted"
            style={{ gridTemplateColumns: wideMiddle ? "minmax(0, 1fr) 5.5rem minmax(0, 1fr)" : "minmax(0, 1fr) 1.75rem minmax(0, 1fr)" }}
        >
            <span className="truncate text-left">{left}</span>
            <span className="text-center">{middle}</span>
            <span className="truncate text-right">{right}</span>
        </div>
    );
}

function MobileFixture({ fixture, reverse = false }) {
    const fixtures = getFixtureItems(fixture);
    if (fixtures.length === 0) return <span className="px-2 py-2 text-center text-xs text-app-muted">-</span>;
    return (
        <div className="grid min-w-0 gap-0.5 py-1">
            {fixtures.map((item, index) => {
                const difficulty = item.difficulty || 3;
                return (
                    <div key={`${item.kickoffTime || item.opponent}-${index}`} className={`flex min-w-0 items-center gap-1 px-1 ${reverse ? "flex-row-reverse text-right" : ""}`}>
                        <span className={`grid size-[1.15rem] shrink-0 place-items-center rounded text-[0.55rem] font-extrabold ${getDifficultyTone(difficulty)}`}>{difficulty}</span>
                        <span className="min-w-0 truncate text-[0.6rem] font-semibold text-app-foreground">{item.opponent || "Unknown"}</span>
                    </div>
                );
            })}
        </div>
    );
}

function getDifficultyTone(difficulty) {
    if (difficulty <= 2) return "bg-emerald-400 text-brand-ink";
    if (difficulty >= 4) return "bg-pink-500 text-white";
    return "bg-app-surface-muted text-app-foreground";
}

function PlayerComparisonHeader({ player, team, reverse = false }) {
    return (
        <div className={`flex min-w-0 items-end gap-1.5 sm:gap-4 ${reverse ? "flex-row-reverse text-right" : "text-left"}`}>
            <div className="relative h-22 w-14 shrink-0 sm:h-40 sm:w-28">
                <ImageWithFallback
                    src={player.photo ? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.photo}.png` : null}
                    fallbackSrc="/UI/player-placeholder.svg"
                    alt={player.viewName}
                    fill
                    sizes="(max-width: 640px) 48px, 112px"
                    className="object-contain object-bottom drop-shadow-lg"
                />
            </div>
            <div className={`mb-3 min-w-0 sm:mb-7 ${reverse ? "items-end" : "items-start"} flex flex-col`}>
                <span className="rounded-full border border-white/35 bg-white/20 px-2 py-0.5 text-[0.64rem] font-extrabold uppercase tracking-wide sm:text-xs">
                    {player.position}
                </span>
                <h2 className="mt-1 w-full truncate text-[0.95rem] leading-tight font-black sm:text-2xl">{player.viewName}</h2>
                <div className={`mt-1 flex min-w-0 items-center gap-1 text-[0.72rem] font-semibold sm:text-sm ${reverse ? "flex-row-reverse" : ""}`}>
                    <span className="grid size-7 shrink-0 place-items-center sm:size-9">
                        <TeamLogo team={team} />
                    </span>
                    <span className="truncate">{player.teamName}</span>
                </div>
                <span className="mt-1.5 rounded-full bg-brand-ink/80 px-2 py-1 text-[0.68rem] font-bold text-white sm:text-xs">
                    {player.points} points
                </span>
            </div>
        </div>
    );
}

export default CompareModal;
