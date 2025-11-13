import TeamLogo from "./TeamLogo";
import Style from "../../../Styles/FixturesTable.module.css";
import { useTeams } from "../../../Context/TeamsContext";

export function FixtureCard({ fixture }) {
    const { teams } = useTeams();

    const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
    const awayTeam = teams.find(t => t.id === fixture.awayTeamId);

    const displayScore =
        fixture.homeScore !== null && fixture.awayScore !== null
            ? `${fixture.homeScore} - ${fixture.awayScore}`
            : new Date(fixture.kickoff_time).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
            });

    return (
        <div className={Style["fixture-card"]}>
            <span className={Style["home-team"]}>
                {homeTeam?.name || "TBD"}
            </span>

            <TeamLogo teamId={homeTeam?.id} />

            <span className={Style.score}>{displayScore}</span>

            <TeamLogo teamId={awayTeam?.id} />

            <span className={Style["away-team"]}>
                {awayTeam?.name || "TBD"}
            </span>
        </div>
    );
}
