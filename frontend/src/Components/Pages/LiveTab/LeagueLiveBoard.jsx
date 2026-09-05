"use client";

import { useMemo, useState } from "react";

import { filterLiveFixtures, getLiveManagers } from "../../../features/live/model";
import { formatAppDateTime } from "../../../lib/dateTime";
import { cn } from "../../../lib/cn";
import ImageWithFallback from "../../../shared/ui/ImageWithFallback";
import SelectField from "../../../shared/ui/SelectField";
import { Activity, Goal } from "../../../shared/ui/icons";
import TeamLogo from "../FixturesTab/TeamLogo";

const ROLE_LABELS = {
    STARTING: "Starting XI",
    BENCH: "Bench",
    IR: "IR",
};

const PARTICIPATION_LABELS = {
    STARTED: "Started",
    SUBSTITUTE: "Came on",
    NOT_PLAYED: "Not featured",
};

function teamFor(teamsById, teamId) {
    return teamsById.get(String(teamId)) ?? { id: teamId, name: `Team ${teamId}`, shortName: "—" };
}

function ScoreTeam({ team, score, align = "left" }) {
    return (
        <div className={cn("flex min-w-0 flex-1 items-center gap-2.5", align === "right" && "flex-row-reverse text-right")}>
            <TeamLogo team={team} className="size-8 sm:size-10" />
            <div className="min-w-0">
                <p className="truncate text-sm font-black text-app-foreground sm:text-base">{team.shortName || team.name}</p>
                <p className="hidden truncate text-[0.68rem] font-semibold text-app-muted sm:block">{team.name}</p>
            </div>
            <span className="text-xl font-black tabular-nums text-app-foreground sm:text-2xl">{score ?? 0}</span>
        </div>
    );
}

function PlayerEvents({ player }) {
    const events = [
        player.goals > 0 && `⚽ ${player.goals}`,
        player.assists > 0 && `A ${player.assists}`,
        player.yellowCards > 0 && `🟨 ${player.yellowCards}`,
        player.redCards > 0 && `🟥 ${player.redCards}`,
    ].filter(Boolean);
    if (events.length === 0) return null;

    return (
        <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Match events">
            {events.map((event) => (
                <span key={event} className="rounded-md border border-app-border bg-app-surface-muted px-1.5 py-0.5 text-[0.62rem] font-black text-app-muted">
                    {event}
                </span>
            ))}
        </div>
    );
}

function LivePlayerRow({ player, team }) {
    const played = player.participation !== "NOT_PLAYED";
    return (
        <article className="grid min-w-0 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-app-border px-3 py-3 first:border-t-0 sm:grid-cols-[3.75rem_minmax(0,1fr)_auto] sm:px-4">
            <div className="relative flex h-14 w-13 items-end justify-center overflow-hidden rounded-xl border border-app-border bg-linear-to-b from-app-surface-elevated to-app-surface-muted sm:h-16 sm:w-15">
                <ImageWithFallback
                    src={player.photo ? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.photo}.png` : null}
                    fallbackSrc="/UI/player-placeholder.svg"
                    alt={player.viewName}
                    width={55}
                    height={70}
                    className="h-full w-auto object-contain object-bottom"
                />
            </div>

            <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="truncate text-sm font-black text-app-foreground sm:text-base">{player.viewName}</h3>
                    {player.captain && (
                        <span className="rounded-full bg-brand-purple px-1.5 py-0.5 text-[0.58rem] font-black text-white">
                            C{player.multiplier > 2 ? "×3" : ""}
                        </span>
                    )}
                    <span className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-app-muted">{player.position}</span>
                </div>
                <p className="mt-0.5 truncate text-xs font-bold text-app-accent-foreground">
                    {player.ownerTeamName} <span className="font-semibold text-app-muted">· {player.ownerName}</span>
                </p>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] font-semibold text-app-muted">
                    <span>{team.shortName || team.name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ROLE_LABELS[player.squadRole] ?? player.squadRole}</span>
                    <span aria-hidden="true">·</span>
                    <span className={played ? "text-app-positive-foreground" : undefined}>
                        {PARTICIPATION_LABELS[player.participation] ?? player.participation}
                        {played ? ` · ${player.minutesPlayed}′` : ""}
                    </span>
                </div>
                <PlayerEvents player={player} />
            </div>

            <div className="min-w-12 text-right">
                <p className="text-xl font-black tabular-nums text-app-foreground sm:text-2xl">{player.points}</p>
                <p className="text-[0.6rem] font-black uppercase tracking-[0.1em] text-app-muted">pts</p>
                {player.multiplier !== 1 && (
                    <p className={cn(
                        "mt-1 text-[0.62rem] font-black",
                        player.contributionPoints > 0 ? "text-app-positive-foreground" : "text-app-muted",
                    )}>
                        {player.multiplier === 0 ? "not counting" : `${player.contributionPoints} counting`}
                    </p>
                )}
            </div>
        </article>
    );
}

function LiveFixtureCard({ fixture, teamsById }) {
    const homeTeam = teamFor(teamsById, fixture.homeTeamId);
    const awayTeam = teamFor(teamsById, fixture.awayTeamId);

    return (
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm" aria-labelledby={`live-fixture-${fixture.id}`}>
            <div className="bg-app-surface-elevated px-3 py-3 sm:px-5 sm:py-4">
                <div className="flex items-center justify-center gap-2 text-[0.64rem] font-black uppercase tracking-[0.14em] text-red-600 dark:text-red-300">
                    <span className="size-2 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden="true" />
                    Live · {fixture.minutes > 0 ? `${fixture.minutes}′` : "Now"}
                </div>
                <h2 id={`live-fixture-${fixture.id}`} className="sr-only">{homeTeam.name} against {awayTeam.name}</h2>
                <div className="mx-auto mt-2 flex max-w-2xl items-center gap-3 sm:gap-6">
                    <ScoreTeam team={homeTeam} score={fixture.homeScore} />
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-app-muted">vs</span>
                    <ScoreTeam team={awayTeam} score={fixture.awayScore} align="right" />
                </div>
            </div>

            {fixture.players.length > 0 ? (
                <div>
                    {fixture.players.map((player) => (
                        <LivePlayerRow
                            key={player.playerId}
                            player={player}
                            team={teamFor(teamsById, player.teamId)}
                        />
                    ))}
                </div>
            ) : (
                <p className="border-t border-app-border px-4 py-7 text-center text-sm font-semibold text-app-muted">
                    No owned players match the current filters.
                </p>
            )}
        </section>
    );
}

function EmptyLiveState({ data, teamsById }) {
    const next = data?.nextFixture;
    const homeTeam = next ? teamFor(teamsById, next.homeTeamId) : null;
    const awayTeam = next ? teamFor(teamsById, next.awayTeamId) : null;

    return (
        <section className="grid min-h-[28rem] place-items-center rounded-3xl border border-app-border bg-app-surface px-5 py-12 text-center shadow-sm">
            <div className="max-w-lg">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-app-border bg-app-surface-elevated text-app-accent-foreground">
                    <Goal className="size-7" aria-hidden="true" />
                </span>
                <p className="mt-5 text-[0.68rem] font-black uppercase tracking-[0.2em] text-app-accent-foreground">Match centre</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-app-foreground">No match is live right now</h1>
                {next ? (
                    <>
                        <p className="mt-3 text-sm leading-6 text-app-muted">The next live board will open automatically at kickoff.</p>
                        <div className="mt-6 rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4">
                            <p className="font-black text-app-foreground">{homeTeam.name} <span className="text-app-muted">vs</span> {awayTeam.name}</p>
                            <p className="mt-1 text-sm font-semibold text-app-muted">{formatAppDateTime(next.kickoffTime) ?? "Kickoff time unavailable"}</p>
                        </div>
                    </>
                ) : (
                    <p className="mt-3 text-sm leading-6 text-app-muted">Come back when the next Premier League match begins.</p>
                )}
            </div>
        </section>
    );
}

export default function LeagueLiveBoard({ data, teams = [] }) {
    const [managerId, setManagerId] = useState("all");
    const [participation, setParticipation] = useState("all");
    const teamsById = useMemo(() => new Map(teams.map((team) => [String(team.id), team])), [teams]);
    const managers = useMemo(() => getLiveManagers(data?.fixtures), [data?.fixtures]);
    const fixtures = useMemo(
        () => filterLiveFixtures(data?.fixtures, managerId, participation),
        [data?.fixtures, managerId, participation],
    );

    if (!data?.fixtures?.length) return <EmptyLiveState data={data} teamsById={teamsById} />;

    const countedPoints = data.fixtures
        .flatMap((fixture) => fixture.players ?? [])
        .reduce((sum, player) => sum + (player.contributionPoints ?? 0), 0);

    return (
        <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <header className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#241035_0%,#47176a_48%,#087f80_100%)] px-5 py-6 text-white shadow-xl sm:px-8 sm:py-8">
                <div className="pointer-events-none absolute -right-12 -top-20 size-52 rounded-full border-[32px] border-white/5" aria-hidden="true" />
                <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.2em] text-cyan-200">
                            <span className="size-2 rounded-full bg-red-400 motion-safe:animate-pulse" aria-hidden="true" />
                            Live match centre
                        </div>
                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Who&apos;s playing now?</h1>
                        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                            Every owned player involved in the matches happening now - and the manager backing them.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                            [data.fixtures.length, "matches"],
                            [data.ownedPlayerCount, "owned"],
                            [countedPoints, "counting pts"],
                        ].map(([value, label]) => (
                            <div key={label} className="min-w-20 rounded-2xl border border-white/15 bg-black/15 px-3 py-2 backdrop-blur-sm">
                                <p className="text-xl font-black tabular-nums">{value}</p>
                                <p className="text-[0.58rem] font-black uppercase tracking-[0.1em] text-white/60">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <section className="grid gap-3 rounded-2xl border border-app-border bg-app-surface px-3 py-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-4" aria-label="Live player filters">
                <SelectField
                    value={managerId}
                    onValueChange={setManagerId}
                    ariaLabel="Filter by manager"
                    options={[
                        { value: "all", label: `All managers · ${managers.length}` },
                        ...managers.map((manager) => ({
                            value: manager.id,
                            label: `${manager.teamName} · ${manager.name}`,
                        })),
                    ]}
                />
                <div className="grid grid-cols-2 rounded-xl border border-app-border bg-app-surface-muted p-1">
                    {[["all", "All owned"], ["played", "Featured"]].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setParticipation(value)}
                            className={cn(
                                "min-h-9 rounded-lg px-3 text-xs font-black transition",
                                participation === value
                                    ? "bg-app-surface-elevated text-app-foreground shadow-sm"
                                    : "text-app-muted hover:text-app-foreground",
                            )}
                            aria-pressed={participation === value}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-2 xl:items-start">
                {fixtures.map((fixture) => (
                    <LiveFixtureCard key={fixture.id} fixture={fixture} teamsById={teamsById} />
                ))}
            </div>

            <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-app-muted">
                <Activity className="size-3.5 text-app-accent-foreground" aria-hidden="true" />
                Updates automatically every minute
            </p>
        </div>
    );
}
