import Image from "next/image";

import { buildPlayerStatRow, buildPlayerStatTotals } from "../../features/players/statsModel";
import { formatAppDateTime } from "../../lib/dateTime";
import { getFixtureItems } from "../../features/fixtures/model";
import { cn } from "../../lib/cn";

const STAT_COLUMNS = [
    ["points", "/Icons/total.svg", "PTS", "Total points", "monochrome"],
    ["minutes", "/Icons/stopwatch.svg", "MP", "Minutes", "monochrome"],
    ["goals", "/Icons/goal.svg", "GS", "Goals", "monochrome"],
    ["assists", "/Icons/assist.svg", "A", "Assists", "monochrome"],
    ["cleanSheets", "/Icons/clean-sheets.svg", "CS", "Clean sheets", "monochrome"],
    ["goalsConceded", "/Icons/goal-conceded.svg", "GC", "Goals conceded", "semantic"],
    ["ownGoals", "/Icons/own-goal.svg", "OG", "Own goals", "semantic"],
    ["penaltiesSaved", "/Icons/penalty-saved.svg", "PS", "Penalties saved", "monochrome"],
    ["penaltiesMissed", "/Icons/penalty-missed.svg", "PM", "Penalties missed", "semantic"],
    ["penaltiesConceded", "/Icons/penalty-conceded.svg", "PC", "Penalties conceded", "monochrome"],
    ["yellowCards", "/Icons/yellow-card.svg", "YC", "Yellow cards", "semantic"],
    ["redCards", "/Icons/red-card.svg", "RC", "Red cards", "semantic"],
];

function PlayerInfoContent({ tab, teamFixtures, matchStats, fixtureBoundary = 0 }) {
    if (tab === "fixtures") {
        const fixtures = Object.entries(teamFixtures ?? {})
            .sort(([firstGameweek], [secondGameweek]) => Number(firstGameweek) - Number(secondGameweek))
            .filter(([gameweek]) => Number(gameweek) > fixtureBoundary)
            .flatMap(([gameweek, fixtureGroup]) => getFixtureItems(fixtureGroup).map((fixture, index) => ({
                gameweek,
                fixture,
                key: `${gameweek}-${fixture.kickoffTime || index}`,
            })));

        return (
            <div className="w-full overflow-x-auto bg-app-surface pb-1 [-webkit-overflow-scrolling:touch]">
                <table className="w-full border-collapse text-[0.78rem] text-app-foreground sm:text-[0.85rem]">
                    <caption className="sr-only">Upcoming player fixtures</caption>
                    <thead>
                        <tr>
                            <th scope="col" className={`${HEADER_CELL} hidden md:table-cell`}>Date</th>
                            <th scope="col" className={`${HEADER_CELL} w-12`}>GW</th>
                            <th scope="col" className={HEADER_CELL}>Opponent</th>
                            <th scope="col" className={HEADER_CELL}>FDR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fixtures.map(({ gameweek, fixture, key }) => {
                            const difficulty = fixture.difficulty || 3;
                            return (
                                <tr key={key}>
                                    <td className={`${BODY_CELL} hidden font-semibold text-app-muted md:table-cell`}>
                                        {formatAppDateTime(fixture.kickoffTime) || "-"}
                                    </td>
                                    <td className={`${BODY_CELL} w-12`}>{gameweek}</td>
                                    <td className={BODY_CELL}>{fixture.opponent || "Unknown"}</td>
                                    <td className={BODY_CELL}>
                                        <span
                                            className={cn(
                                                "inline-grid size-6 place-items-center rounded-md text-[0.75rem] font-black sm:size-[26px] sm:text-[0.8rem]",
                                                difficulty <= 3 ? "text-slate-950" : "text-white",
                                            )}
                                            style={{ backgroundColor: getFdrColor(difficulty) }}
                                        >
                                            {difficulty}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {fixtures.length === 0 && (
                            <tr><td className={`${BODY_CELL} py-8 text-app-muted`} colSpan="4">No upcoming fixtures.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    const rows = [...(matchStats ?? [])]
        .sort((first, second) => first.gameweekId - second.gameweekId)
        .map((match) => buildPlayerStatRow(match, teamFixtures));
    const totals = buildPlayerStatTotals(rows);

    return (
        <div className="w-full overflow-x-auto bg-app-surface pb-1 [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[650px] border-collapse text-[0.78rem] text-app-foreground sm:text-[0.85rem]">
                <caption className="sr-only">Player statistics by gameweek</caption>
                <thead>
                    <tr aria-hidden="true">
                        <th className={ICON_HEADER_CELL} /><th className={ICON_HEADER_CELL} />
                        {STAT_COLUMNS.map(([field, icon, , label, tone]) => (
                            <th className={ICON_HEADER_CELL} key={field}>
                                <Image
                                    src={icon}
                                    alt=""
                                    width={24}
                                    height={24}
                                    title={label}
                                    className={cn(
                                        "mx-auto block size-[22px] object-contain",
                                        tone === "semantic"
                                            ? "saturate-[1.08] brightness-[1.04] contrast-[1.05]"
                                            : "contrast-125 dark:invert dark:brightness-125 dark:contrast-110",
                                    )}
                                />
                            </th>
                        ))}
                    </tr>
                    <tr>
                        <th scope="col" className={`${HEADER_CELL} w-11`}>GW</th>
                        <th scope="col" className={HEADER_CELL}>OPP</th>
                        {STAT_COLUMNS.map(([field, , abbreviation, label]) => (
                            <th scope="col" className={HEADER_CELL} key={field}><abbr title={label}>{abbreviation}</abbr></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.key}>
                            <td className={`${BODY_CELL} w-11`}><strong>{row.gameweek}</strong></td>
                            <td className={BODY_CELL}>{row.opponent}</td>
                            {STAT_COLUMNS.map(([field]) => (
                                <td
                                    key={field}
                                    className={cn(
                                        BODY_CELL,
                                        field === "points" && "bg-app-accent-surface font-extrabold text-app-accent-foreground",
                                    )}
                                >
                                    {field === "points" ? <strong>{row[field]}</strong> : row[field]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {rows.length === 0 && <tr><td className={`${BODY_CELL} py-8 text-app-muted`} colSpan="14">No match statistics yet.</td></tr>}
                    <tr className="border-t-2 border-app-border bg-app-surface-muted font-extrabold">
                        <td className={BODY_CELL} /><td className={BODY_CELL}><strong>Total</strong></td>
                        {STAT_COLUMNS.map(([field]) => <td className={BODY_CELL} key={field}><strong>{totals[field]}</strong></td>)}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

const HEADER_CELL = "sticky top-0 z-[5] whitespace-nowrap border-b border-app-border bg-app-surface-muted px-1 py-3 text-center text-[0.68rem] font-extrabold uppercase tracking-[0.04em] text-app-muted sm:px-1.5 sm:text-[0.73rem]";
const ICON_HEADER_CELL = "h-11 border-0 bg-app-surface-muted px-1.5 pb-1.5 pt-2 align-middle";
const BODY_CELL = "whitespace-nowrap border-b border-app-border bg-app-surface px-1 py-2.5 text-center transition-colors group-hover:bg-app-accent-hover sm:px-1.5 sm:py-[11px]";

function getFdrColor(difficulty) {
    const colors = {
        1: "#00FF87",
        2: "#00D36D",
        3: "#EDEDED",
        4: "#FF2670",
        5: "#7B004D",
    };
    return colors[difficulty] ?? "#ccc";
}

export default PlayerInfoContent;
