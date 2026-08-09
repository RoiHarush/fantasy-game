import { useMemo } from "react";

import SquadPlayerRow from "./SquadPlayerRow";

const EMPTY_SQUAD = { startingLineup: {}, bench: {} };
const SECTIONS = [
    { key: "GK", label: "Goalkeepers", size: 2 },
    { key: "DEF", label: "Defenders", size: 5 },
    { key: "MID", label: "Midfielders", size: 5 },
    { key: "FWD", label: "Forwards", size: 3 },
];

function SquadPlayersTable({
    squad,
    players = [],
    fixturesByTeam = {},
    nextGameweek,
    isLoading = false,
    error = null,
}) {
    const safeSquad = squad || EMPTY_SQUAD;
    const playersById = useMemo(
        () => new Map(players.map((player) => [String(player.id), player])),
        [players],
    );

    const getNextFixtureText = (player) => {
        if (!nextGameweek) return "-";
        const fixture = fixturesByTeam[player.teamId]?.[nextGameweek.id];
        if (!fixture) return "-";
        const match = fixture.opponent.match(/^(.*)\s\((H|A)\)$/);
        const fullName = match ? match[1].trim() : fixture.opponent;
        return `${fullName} (${match ? match[2] : ""})`;
    };

    const getPlayersByPosition = (position) => {
        const starting = safeSquad.startingLineup?.[position] || [];
        const bench = Object.values(safeSquad.bench || {}).filter((id) => (
            playersById.get(String(id))?.position === position
        ));
        return [...starting, ...bench];
    };

    if (isLoading) return <p className="p-5 text-sm text-app-muted" role="status">Loading squad...</p>;
    if (error) return <p className="p-5 text-sm text-app-danger-foreground" role="alert">{error.message || "Squad data is temporarily unavailable."}</p>;

    return (
        <div className="w-full max-w-full overflow-hidden bg-app-surface">
            {SECTIONS.map((section) => {
                const ids = getPlayersByPosition(section.key);
                const slots = Array.from({ length: section.size }, (_, index) => ids[index] ?? null);
                return (
                    <section key={section.key} className="border-b border-app-border last:border-b-0">
                        <h3 className="w-fit rounded-r-full bg-app-accent-surface px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-app-accent-foreground">
                            {section.label}
                        </h3>
                        <table className="w-full max-w-full border-collapse" style={{ width: "100%", maxWidth: "100%", tableLayout: "fixed" }}>
                            <caption className="sr-only">{section.label} squad slots</caption>
                            <colgroup>
                                <col style={{ width: "2.25rem" }} />
                                <col />
                                <col style={{ width: "3.75rem" }} />
                            </colgroup>
                            <thead>
                                <tr className="text-[0.5rem] font-bold uppercase tracking-wider text-app-muted sm:text-[0.62rem]">
                                    <th className="py-1"><span className="sr-only">Information</span></th>
                                    <th className="py-1 text-left"><span className="sr-only">Player</span></th>
                                    <th className="px-1.5 py-1 text-right">FIX</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slots.map((id, index) => {
                                    const player = playersById.get(String(id));
                                    return (
                                        <SquadPlayerRow
                                            key={id || `${section.key}-empty-${index}`}
                                            player={player}
                                            fixture={player ? getNextFixtureText(player) : "-"}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </section>
                );
            })}
        </div>
    );
}

export default SquadPlayersTable;
