import TeamLogo from "./TeamLogo";
import teams from "../../../MockData/teams";
import Style from "../../../Styles/FixturesTable.module.css";

export function FixtureCard({ fixture }) {
    const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
    const awayTeam = teams.find(t => t.id === fixture.awayTeamId);

    // אם אין תוצאה -> הצג שעה
    const displayScore = fixture.homeScore !== null && fixture.awayScore !== null
        ? `${fixture.homeScore} - ${fixture.awayScore}`
        : new Date(fixture.kickoff_time).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
        });

    return (
        <div className={Style["fixture-card"]}>
            <span className={Style["home-team"]}>
                {homeTeam?.name}
            </span>

            <TeamLogo teamId={homeTeam?.id} />

            <span className={Style.score}>
                {displayScore}
            </span>

            <TeamLogo teamId={awayTeam?.id} />

            <span className={Style["away-team"]}>
                {awayTeam?.name}
            </span>
        </div>
    );
}
