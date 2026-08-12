"use client";

import Image from "next/image";
import { useState } from "react";

import { getFixtureGameweekNavigation, groupFixturesByDay } from "../../../features/fixtures/model";
import { useFixtures } from "../../../features/fixtures/useFixtures";
import { useTeams } from "../../../features/teams/useTeams";
import { formatAppLongDate } from "../../../lib/dateTime";
import { FixtureCard } from "./FixtureCard";

const STATUS_CLASS = "m-4 text-center text-app-muted";

function FixturesTable({ gameweeks, defaultGameweek, previewData }) {
    const [selectedGameweekId, setSelectedGameweekId] = useState(null);
    const preview = previewData != null;
    const fixturesQuery = useFixtures(!preview);
    const teamsQuery = useTeams({ enabled: !preview });
    const defaultGameweekId = defaultGameweek?.id ?? gameweeks[0]?.id ?? null;
    const currentGameweekId = selectedGameweekId ?? defaultGameweekId;
    const navigation = getFixtureGameweekNavigation(gameweeks, currentGameweekId);
    const teams = preview ? previewData.teams ?? [] : teamsQuery.teams;
    const fixtures = preview ? previewData.fixtures ?? [] : fixturesQuery.data ?? [];
    const pending = !preview && (fixturesQuery.isPending || teamsQuery.isPending);
    const error = !preview && (fixturesQuery.error || teamsQuery.error);
    const teamsById = new Map(teams.map((team) => [String(team.id), team]));
    const gameweekFixtures = fixtures.filter(
        (fixture) => String(fixture.event) === String(currentGameweekId),
    );
    const fixtureDays = groupFixturesByDay(gameweekFixtures);

    function handlePrevious() {
        if (!navigation.canGoPrevious) return;
        setSelectedGameweekId(navigation.orderedGameweeks[navigation.selectedIndex - 1].id);
    }

    function handleNext() {
        if (!navigation.canGoNext) return;
        setSelectedGameweekId(navigation.orderedGameweeks[navigation.selectedIndex + 1].id);
    }

    return (
        <div className="w-full max-w-[1000px] overflow-hidden rounded-[14px] border border-app-border bg-app-surface shadow-[0_12px_28px_color-mix(in_srgb,var(--app-foreground)_10%,transparent)]">
            <div className="relative z-[2] flex w-full flex-col overflow-hidden bg-component-gradient pb-[30px]">
                <div className="relative z-[2] flex items-center gap-2.5 px-[15px] pb-2 pt-3 md:px-5 md:pb-2.5 md:pt-4">
                    <Image
                        src="/UI/premier-league-logo.svg"
                        alt="Premier League Logo"
                        width={90}
                        height={90}
                        className="h-auto w-[30px] md:w-10"
                    />
                    <h2 className="m-0 text-[1.1rem] font-extrabold text-brand-ink min-[481px]:text-[1.3rem] md:text-2xl">
                        Fixtures – Gameweek {currentGameweekId}
                    </h2>
                </div>

                <div className="relative z-[2] grid grid-cols-[80px_1fr_80px] items-center px-0 pb-3.5 pt-2.5 text-center text-[0.82rem] text-brand-ink before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(to_right,transparent,rgb(255_255_255_/_78%),transparent)] before:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[linear-gradient(to_right,transparent,rgb(255_255_255_/_78%),transparent)] after:content-[''] min-[481px]:text-base md:grid-cols-[120px_1fr_120px]">
                    {navigation.canGoPrevious ? (
                        <button
                            type="button"
                            onClick={handlePrevious}
                            className="cursor-pointer border-0 bg-transparent font-bold text-brand-ink transition-[color,transform] duration-150 focus-visible:-translate-y-px focus-visible:text-white focus-visible:outline-none pointer-fine:hover:-translate-y-px pointer-fine:hover:text-white"
                        >
                            ← Previous
                        </button>
                    ) : <span aria-hidden="true" />}
                    <div className="font-bold">Gameweek {currentGameweekId}</div>
                    {navigation.canGoNext ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="cursor-pointer border-0 bg-transparent font-bold text-brand-ink transition-[color,transform] duration-150 focus-visible:-translate-y-px focus-visible:text-white focus-visible:outline-none pointer-fine:hover:-translate-y-px pointer-fine:hover:text-white"
                        >
                            Next →
                        </button>
                    ) : <span aria-hidden="true" />}
                </div>

                <Image
                    src="/UI/pattern-2.png"
                    alt=""
                    width={900}
                    height={220}
                    className="pointer-events-none absolute right-0 top-0 z-0 h-auto w-[120px] object-contain md:w-[180px]"
                />
                <div className="pointer-events-none absolute bottom-0 left-0 z-[1] h-[100px] w-full bg-[linear-gradient(to_bottom,transparent_0%,var(--app-surface)_100%)]" />
            </div>

            <div className="mx-auto w-full max-w-[1000px] px-2.5 pb-5 pt-2.5 text-app-foreground min-[481px]:px-3.5">
                {pending && <p role="status" className={STATUS_CLASS}>Loading fixtures…</p>}
                {error && (
                    <p role="alert" className={STATUS_CLASS}>Fixture data is temporarily unavailable.</p>
                )}
                {!pending && !error && fixtureDays.length === 0 && (
                    <p role="status" className={STATUS_CLASS}>No fixtures are scheduled for this gameweek.</p>
                )}
                {fixtureDays.map(({ dateKey, fixtures }) => (
                    <section key={dateKey} className="my-5">
                        <h4 className="my-2.5 border-l-4 border-app-accent pl-2.5 text-[1.05rem] font-bold text-app-foreground">
                            {formatAppLongDate(fixtures[0].kickoff_time)}
                        </h4>
                        {fixtures.map((fixture) => (
                            <FixtureCard
                                key={fixture.id}
                                fixture={fixture}
                                homeTeam={teamsById.get(String(fixture.homeTeamId))}
                                awayTeam={teamsById.get(String(fixture.awayTeamId))}
                            />
                        ))}
                    </section>
                ))}
            </div>
        </div>
    );
}

export default FixturesTable;
