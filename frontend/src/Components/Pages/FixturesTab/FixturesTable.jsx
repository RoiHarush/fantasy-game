"use client";

import Image from "next/image";
import { useState } from "react";

import { getFixtureGameweekNavigation, groupFixturesByDay } from "../../../features/fixtures/model";
import { useFixtures } from "../../../features/fixtures/useFixtures";
import { useTeams } from "../../../features/teams/useTeams";
import { formatAppLongDate } from "../../../lib/dateTime";
import styles from "../../../Styles/FixturesTable.module.css";
import { FixtureCard } from "./FixtureCard";

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
        <div className={styles.fixturesWrapper}>
            <div className={styles.fixturesTop}>
                <div className={styles.fixturesHeader}>
                    <Image
                        src="/UI/premier-league-logo.svg"
                        alt="Premier League Logo"
                        className={styles.fixturesLogo}
                        width={90}
                        height={90}
                    />
                    <h2 className={styles.fixturesTitle}>
                        Fixtures – Gameweek {currentGameweekId}
                    </h2>
                </div>

                <div className={styles.fixturesControls}>
                    {navigation.canGoPrevious ? (
                        <button type="button" onClick={handlePrevious} className={styles.controlButton}>
                            ← Previous
                        </button>
                    ) : <span aria-hidden="true" />}
                    <div className={styles.gameweekInfo}>Gameweek {currentGameweekId}</div>
                    {navigation.canGoNext ? (
                        <button type="button" onClick={handleNext} className={styles.controlButton}>
                            Next →
                        </button>
                    ) : <span aria-hidden="true" />}
                </div>

                <Image src="/UI/pattern-2.png" alt="" width={900} height={220} className={styles.fixturesPattern} />
                <div className={styles.fixturesFade} />
            </div>

            <div className={styles["fixtures-table"]}>
                {pending && <p role="status">Loading fixtures…</p>}
                {error && (
                    <p role="alert">Fixture data is temporarily unavailable.</p>
                )}
                {!pending && !error && fixtureDays.length === 0 && (
                    <p role="status">No fixtures are scheduled for this gameweek.</p>
                )}
                {fixtureDays.map(({ dateKey, fixtures }) => (
                    <section key={dateKey} className={styles["fixtures-day-block"]}>
                        <h4 className={styles["fixtures-day-title"]}>
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
