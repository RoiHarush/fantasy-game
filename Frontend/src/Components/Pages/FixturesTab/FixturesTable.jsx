import { useState } from "react";
import { FixtureCard } from "./FixtureCard";
import fixtures from "../../../MockData/fixtures.jsx";
import Style from "../../../Styles/FixturesTable.module.css";

function FixturesTable({ gameweeks, defaultGameweek }) {
    // נתחיל מהמחזור שהגיע מה־props
    const [currentGameweek, setCurrentGameweek] = useState(defaultGameweek?.id || 1);

    const gameweekFixtures = fixtures.filter(f => f.event === currentGameweek);

    const handlePrev = () => {
        if (currentGameweek > 1) {
            setCurrentGameweek(currentGameweek - 1);
        }
    };

    const handleNext = () => {
        if (currentGameweek < gameweeks.length) {
            setCurrentGameweek(currentGameweek + 1);
        }
    };

    // קיבוץ לפי יום
    const fixturesByDay = gameweekFixtures.reduce((acc, fix) => {
        const dateKey = new Date(fix.kickoff_time).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(fix);
        return acc;
    }, {});

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
                    <button onClick={handlePrev} className={Style.controlButton}>
                        ← Previous
                    </button>
                    <div className={Style.gameweekInfo}>
                        Gameweek {currentGameweek}
                    </div>
                    <button onClick={handleNext} className={Style.controlButton}>
                        Next →
                    </button>
                </div>

                <img src="/UI/pattern-2.png" alt="pattern" className={Style.fixturesPattern} />
                <div className={Style.fixturesFade}></div>
            </div>

            <div className={Style["fixtures-table"]}>
                {Object.entries(fixturesByDay).map(([day, dayFixtures]) => (
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
