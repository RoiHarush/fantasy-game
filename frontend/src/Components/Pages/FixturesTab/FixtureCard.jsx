import { formatAppTime } from "../../../lib/dateTime";
import styles from "../../../Styles/FixturesTable.module.css";
import TeamLogo from "./TeamLogo";

export function FixtureCard({ fixture, homeTeam, awayTeam }) {
    const displayScore =
        fixture.homeScore !== null && fixture.awayScore !== null
            ? `${fixture.homeScore} - ${fixture.awayScore}`
            : formatAppTime(fixture.kickoff_time) || "TBA";

    return (
        <article className={styles["fixture-card"]}>
            <span className={styles["home-team"]}>
                {homeTeam?.name || "TBD"}
            </span>

            <TeamLogo team={homeTeam} />

            <span className={styles.score}>{displayScore}</span>

            <TeamLogo team={awayTeam} />

            <span className={styles["away-team"]}>
                {awayTeam?.name || "TBD"}
            </span>
        </article>
    );
}
