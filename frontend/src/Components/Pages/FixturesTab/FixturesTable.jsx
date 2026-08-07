import { useState } from "react";
import { FixtureCard } from "./FixtureCard";
import Style from "../../../Styles/FixturesTable.module.css";
import { useFixtures } from "../../../features/fixtures/useFixtures";

function FixturesTable({ gameweeks, defaultGameweek }) {
    const [selectedGameweek, setSelectedGameweek] = useState(null);
    const { data: fixtures = [] } = useFixtures();

    const orderedGameweeks = [...gameweeks].sort((a, b) => a.id - b.id);
    const currentGameweek = selectedGameweek ?? defaultGameweek?.id ?? orderedGameweeks[0]?.id ?? 1;
    const currentIndex = orderedGameweeks.findIndex(gameweek => gameweek.id === currentGameweek);

    const gameweekFixtures = fixtures.filter(f => f.event === currentGameweek);

    const handlePrev = () => {
        if (currentIndex > 0) setSelectedGameweek(orderedGameweeks[currentIndex - 1].id);
    };

    const handleNext = () => {
        if (currentIndex >= 0 && currentIndex < orderedGameweeks.length - 1) {
            setSelectedGameweek(orderedGameweeks[currentIndex + 1].id);
        }
    };

    const fixturesByDay = gameweekFixtures.reduce((acc, fix) => {
        const dateKey = new Date(fix.kickoff_time).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(fix);
        return acc;
    }, {});

    const sortedFixturesByDay = Object.entries(fixturesByDay)
        .map(([day, dayFixtures]) => [
            day,
            dayFixtures.sort(
                (a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time)
            ),
        ])
        .sort(
            (a, b) => new Date(a[1][0].kickoff_time) - new Date(b[1][0].kickoff_time)
        );

    return (
        <div className={Style.fixturesWrapper}>
            <div className={Style.fixturesTop}>
                <div className={Style.fixturesHeader}>
                    <img
                        src="/UI/premier-league-logo.svg"
                        alt="Premier League Logo"
                        className={Style.fixturesLogo}
                    />
                    <h2 className={Style.fixturesTitle}>
                        Fixtures – Gameweek {currentGameweek}
                    </h2>
                </div>

                <div className={Style.fixturesControls}>
                    <button
                        onClick={handlePrev}
                        className={Style.controlButton}
                        style={{ visibility: currentIndex <= 0 ? "hidden" : "visible" }}
                    >
                        ← Previous
                    </button>
                    <div className={Style.gameweekInfo}>
                        Gameweek {currentGameweek}
                    </div>
                    <button
                        onClick={handleNext}
                        className={Style.controlButton}
                        style={{ visibility: currentIndex < 0 || currentIndex >= orderedGameweeks.length - 1 ? "hidden" : "visible" }}
                    >
                        Next →
                    </button>
                </div>

                <img src="/UI/pattern-2.png" alt="pattern" className={Style.fixturesPattern} />
                <div className={Style.fixturesFade}></div>
            </div>

            <div className={Style["fixtures-table"]}>
                {sortedFixturesByDay.map(([day, dayFixtures]) => (
                    <div key={day} className={Style["fixtures-day-block"]}>
                        <h4 className={Style["fixtures-day-title"]}>
                            {new Date(dayFixtures[0].kickoff_time).toLocaleDateString("en-GB", {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                            })}
                        </h4>
                        {dayFixtures.map((fix) => (
                            <FixtureCard key={fix.id} fixture={fix} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FixturesTable;
