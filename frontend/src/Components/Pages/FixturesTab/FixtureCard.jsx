import { formatAppTime } from "../../../lib/dateTime";
import TeamLogo from "./TeamLogo";

export function FixtureCard({ fixture, homeTeam, awayTeam }) {
    const displayScore =
        fixture.homeScore !== null && fixture.awayScore !== null
            ? `${fixture.homeScore} - ${fixture.awayScore}`
            : formatAppTime(fixture.kickoff_time) || "TBA";

    return (
        <article className="my-2.5 grid grid-cols-[minmax(0,1fr)_auto_50px_auto_minmax(0,1fr)] items-center rounded-xl border border-app-border bg-app-surface-elevated px-2.5 py-3 shadow-[0_2px_8px_color-mix(in_srgb,var(--app-foreground)_8%,transparent)] transition-[transform,box-shadow,border-color] duration-150 pointer-fine:hover:-translate-y-0.5 pointer-fine:hover:border-[color-mix(in_srgb,var(--app-accent)_38%,var(--app-border))] pointer-fine:hover:shadow-[0_10px_22px_color-mix(in_srgb,var(--app-foreground)_12%,transparent)] md:grid-cols-[minmax(0,1fr)_auto_60px_auto_minmax(0,1fr)] md:px-[18px] md:py-3.5">
            <span className="overflow-hidden whitespace-nowrap pr-2 text-right text-sm font-semibold text-app-foreground text-ellipsis md:pr-3 md:text-base">
                {homeTeam?.name || "TBD"}
            </span>

            <TeamLogo team={homeTeam} />

            <span className="text-center text-[1.1rem] font-extrabold text-app-foreground md:text-xl">{displayScore}</span>

            <TeamLogo team={awayTeam} />

            <span className="overflow-hidden whitespace-nowrap pl-2 text-left text-sm font-semibold text-app-foreground text-ellipsis md:pl-3 md:text-base">
                {awayTeam?.name || "TBD"}
            </span>
        </article>
    );
}
