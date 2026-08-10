import Image from "next/image";

import { buildPlayerStatRow, buildPlayerStatTotals } from "../../features/players/statsModel";
import { formatAppDateTime } from "../../lib/dateTime";
import { getFixtureItems } from "../../features/fixtures/model";
import Style from "../../Styles/PlayerInfoContent.module.css";

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
            <div className={Style.tableWrapper}>
                <table className={Style.table}>
                    <caption className="sr-only">Upcoming player fixtures</caption>
                    <thead>
                        <tr>
                            <th scope="col" className={Style.hideOnMobile}>Date</th>
                            <th scope="col" className={Style.gwColumn}>GW</th>
                            <th scope="col">Opponent</th>
                            <th scope="col">FDR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fixtures.map(({ gameweek, fixture, key }) => {
                            const difficulty = fixture.difficulty || 3;
                            return (
                                <tr key={key}>
                                    <td className={`${Style.dateCell} ${Style.hideOnMobile}`}>
                                        {formatAppDateTime(fixture.kickoffTime) || "-"}
                                    </td>
                                    <td className={Style.gwColumn}>{gameweek}</td>
                                    <td>{fixture.opponent || "Unknown"}</td>
                                    <td>
                                        <span
                                            className={`${Style.fdrBox} ${difficulty <= 3 ? Style.lightFdr : Style.darkFdr}`}
                                            style={{ backgroundColor: getFdrColor(difficulty) }}
                                        >
                                            {difficulty}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {fixtures.length === 0 && (
                            <tr><td colSpan="4">No upcoming fixtures.</td></tr>
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
        <div className={Style.tableWrapper}>
            <table className={Style.statsTable}>
                <caption className="sr-only">Player statistics by gameweek</caption>
                <thead>
                    <tr className={Style.iconRow} aria-hidden="true">
                        <th /><th />
                        {STAT_COLUMNS.map(([field, icon, , label, tone]) => (
                            <th key={field}>
                                <Image
                                    src={icon}
                                    alt=""
                                    width={24}
                                    height={24}
                                    title={label}
                                    className={`${Style.statIcon} ${tone === "semantic" ? Style.semanticIcon : Style.monochromeIcon}`}
                                />
                            </th>
                        ))}
                    </tr>
                    <tr>
                        <th scope="col" className={Style.gwColumn}>GW</th>
                        <th scope="col">OPP</th>
                        {STAT_COLUMNS.map(([field, , abbreviation, label]) => (
                            <th scope="col" key={field}><abbr title={label}>{abbreviation}</abbr></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.key}>
                            <td className={Style.gwColumn}><strong>{row.gameweek}</strong></td>
                            <td>{row.opponent}</td>
                            {STAT_COLUMNS.map(([field]) => (
                                <td key={field} className={field === "points" ? Style.pointsCell : undefined}>
                                    {field === "points" ? <strong>{row[field]}</strong> : row[field]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {rows.length === 0 && <tr><td colSpan="14">No match statistics yet.</td></tr>}
                    <tr className={Style.totalRow}>
                        <td /><td><strong>Total</strong></td>
                        {STAT_COLUMNS.map(([field]) => <td key={field}><strong>{totals[field]}</strong></td>)}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

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
