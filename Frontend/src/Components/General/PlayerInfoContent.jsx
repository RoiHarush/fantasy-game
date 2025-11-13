import { useGameweek } from "../../Context/GameweeksContext";
import Style from "../../Styles/PlayerInfoContent.module.css";

function PlayerInfoContent({ player, tab, teamFixtures, matchStats }) {
    const { currentGameweek } = useGameweek();

    const getFdrColor = (difficulty) => {
        switch (difficulty) {
            case 1: return "#00FF87";
            case 2: return "#00D36D";
            case 3: return "#EDEDED";
            case 4: return "#FF2670";
            case 5: return "#7B004D";
            default: return "#ccc";
        }
    };

    if (!player) return null;

    return (
        <>
            {tab === "fixtures" ? (
                <table className={Style.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>GW</th>
                            <th>Opponent</th>
                            <th>FDR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(teamFixtures || {})
                            .sort(([gwA], [gwB]) => Number(gwA) - Number(gwB))
                            .filter(([gw]) => Number(gw) > currentGameweek.id)
                            .map(([gw, fixture]) => {
                                const opponent = fixture.opponent || "Unknown";
                                const difficulty = fixture.difficulty || 3;
                                const date = fixture.kickoffTime
                                    ? new Date(fixture.kickoffTime).toLocaleString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        timeZoneName: "short"
                                    })
                                    : "-";
                                return (
                                    <tr key={gw}>
                                        <td>{date}</td>
                                        <td>{gw}</td>
                                        <td>{opponent}</td>
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
                    </tbody>
                </table>
            ) : (
                <table className={Style.table}>
                    <thead>
                        <tr className={Style.iconRow}>
                            <th></th>
                            <th></th>
                            <th><img src="/Icons/total.svg" alt="Total" /></th>
                            <th><img src="/Icons/stopwatch.svg" alt="Minutes" /></th>
                            <th><img src="/Icons/goal.svg" alt="Goals" /></th>
                            <th><img src="/Icons/assist.svg" alt="Assists" /></th>
                            <th><img src="/Icons/clean-sheets.svg" alt="Clean Sheets" /></th>
                            <th><img src="/Icons/goal-conceded.svg" alt="Goals Conceded" /></th>
                            <th><img src="/Icons/yellow-card.svg" alt="Yellow Card" /></th>
                            <th><img src="/Icons/red-card.svg" alt="Red Card" /></th>
                            <th><img src="/Icons/penalty-missed.svg" alt="Penalty Missed" /></th>
                            <th><img src="/Icons/own-goal.svg" alt="Own Goal" /></th>
                        </tr>
                        <tr>
                            <th>GW</th>
                            <th>OPP</th>
                            <th>PTS</th>
                            <th>MP</th>
                            <th>GS</th>
                            <th>A</th>
                            <th>CS</th>
                            <th>GC</th>
                            <th>YC</th>
                            <th>RC</th>
                            <th>PM</th>
                            <th>OG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matchStats.map((stat, idx) => {
                            const gw = idx + 1;
                            const fixture = teamFixtures?.[gw] || teamFixtures?.[String(gw)];
                            const opponent = fixture?.opponent || "Unknown";

                            const totalRow = stat.stats.find(s => s.name === "Total");
                            const minutes = stat.stats.find(s => s.name === "Minutes played")?.value || "0";
                            const goals = stat.stats.find(s => s.name === "Goals")?.value || "0";
                            const assists = stat.stats.find(s => s.name === "Assists")?.value || "0";
                            const cs = stat.stats.find(s => s.name === "Clean sheets") ? 1 : 0;
                            const gc = stat.stats.find(s => s.name === "Goals conceded")?.value || "0";
                            const yc = stat.stats.find(s => s.name === "Yellow cards")?.value || "0";
                            const rc = stat.stats.find(s => s.name === "Red cards")?.value || "0";
                            const pm = stat.stats.find(s => s.name === "Penalties missed")?.value || "0";
                            const og = stat.stats.find(s => s.name === "Own goals")?.value || "0";

                            return (
                                <tr key={idx}>
                                    <td>{gw}</td>
                                    <td>{opponent}</td>
                                    <td>{totalRow?.points || 0}</td>
                                    <td>{minutes}</td>
                                    <td>{goals}</td>
                                    <td>{assists}</td>
                                    <td>{cs}</td>
                                    <td>{gc}</td>
                                    <td>{yc}</td>
                                    <td>{rc}</td>
                                    <td>{pm}</td>
                                    <td>{og}</td>
                                </tr>
                            );
                        })}

                        <tr className={Style.totalRow}>
                            <td><strong>Totals</strong></td>
                            <td></td>
                            <td><strong>{matchStats.reduce((a, b) => a + (b.stats.find(s => s.name === "Total")?.points || 0), 0)}</strong></td>
                            <td><strong>{matchStats.reduce((a, b) => a + (parseInt(b.stats.find(s => s.name === "Minutes played")?.value || 0)), 0)}</strong></td>
                            <td><strong>{matchStats.reduce((a, b) => a + (parseInt(b.stats.find(s => s.name === "Goals")?.value || 0)), 0)}</strong></td>
                            <td><strong>{matchStats.reduce((a, b) => a + (parseInt(b.stats.find(s => s.name === "Assists")?.value || 0)), 0)}</strong></td>
                            <td><strong>{matchStats.filter(m => m.stats.find(s => s.name === "Clean sheets")).length}</strong></td>
                            <td><strong>{matchStats.reduce((a, b) => a + (parseInt(b.stats.find(s => s.name === "Goals conceded")?.value || 0)), 0)}</strong></td>
                            <td><strong>{matchStats.reduce((a, b) => a + (parseInt(b.stats.find(s => s.name === "Yellow cards")?.value || 0)), 0)}</strong></td>
                            <td><strong>{matchStats.reduce((a, b) => a + (parseInt(b.stats.find(s => s.name === "Red cards")?.value || 0)), 0)}</strong></td>
                            <td><strong>{matchStats.reduce((a, b) => a + (parseInt(b.stats.find(s => s.name === "Penalties missed")?.value || 0)), 0)}</strong></td>
                            <td><strong>{matchStats.reduce((a, b) => a + (parseInt(b.stats.find(s => s.name === "Own goals")?.value || 0)), 0)}</strong></td>
                        </tr>
                    </tbody>
                </table>

            )}
        </>
    );
}

export default PlayerInfoContent;
