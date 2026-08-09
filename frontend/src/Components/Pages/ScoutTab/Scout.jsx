import PlayersWrapper from "../../General/PlayersWrapper";

function Scout({ user, players, teams, fixturesByTeam, squad, waiverEntries, onWaiverEntriesChange, onWaiverEntriesSave, waiverDirty, waiverSaving, waiverMessage, waiverGameweekId, irWaiverEntries, onIrWaiverEntriesChange, onIrWaiverEntriesSave, irWaiverDirty, irWaiverSaving, irWaiverMessage }) {
    if (players.length === 0) return <p role="status">No players are available.</p>;

    return (
        <section className="min-w-0 w-full">
            <header className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-app-accent-foreground">Player research</p>
                <h1 className="mt-1 text-2xl font-extrabold text-app-foreground sm:text-3xl">Scout</h1>
                <p className="mt-1 max-w-2xl text-sm text-app-muted">
                    Compare players, follow your watchlist, and prepare your next squad move.
                </p>
            </header>
            <PlayersWrapper
                user={user}
                players={players}
                teams={teams}
                allTeamFixtures={fixturesByTeam}
                squad={squad}
                waiverEntries={waiverEntries}
                onWaiverEntriesChange={onWaiverEntriesChange}
                onWaiverEntriesSave={onWaiverEntriesSave}
                waiverDirty={waiverDirty}
                waiverSaving={waiverSaving}
                waiverMessage={waiverMessage}
                waiverGameweekId={waiverGameweekId}
                irWaiverEntries={irWaiverEntries}
                onIrWaiverEntriesChange={onIrWaiverEntriesChange}
                onIrWaiverEntriesSave={onIrWaiverEntriesSave}
                irWaiverDirty={irWaiverDirty}
                irWaiverSaving={irWaiverSaving}
                irWaiverMessage={irWaiverMessage}
            />
        </section>
    );
}

export default Scout;
