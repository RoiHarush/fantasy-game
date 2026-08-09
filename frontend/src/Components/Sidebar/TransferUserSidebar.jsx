import SidebarContainer from "../Sidebar/SidebarContainer";
import SquadPlayersTable from "./SquadPlayersTable";

function TransferUserSidebar({
    users,
    currentUserId,
    onUserChange,
    squad,
    players,
    fixturesByTeam,
    nextGameweek,
    isLoading = false,
    error = null,
}) {
    const handleChange = (e) => {
        const newUserId = Number(e.target.value);
        onUserChange?.(newUserId);
    };

    return (
        <SidebarContainer>
            <section className="w-full overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel">
                <header className="bg-component-gradient p-4 text-brand-ink">
                    <label className="mb-2 block text-xs font-extrabold uppercase tracking-widest" htmlFor="transfer-team-select">View squad</label>
                    <select
                        id="transfer-team-select"
                        value={currentUserId || ""}
                        onChange={handleChange}
                        className="h-11 w-full rounded-control border border-white/55 bg-white/75 px-3 text-sm font-bold text-brand-ink outline-none transition focus:border-white focus:ring-3 focus:ring-white/35"
                    >
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>
                </header>

                <div>
                    <SquadPlayersTable
                        squad={squad}
                        players={players}
                        fixturesByTeam={fixturesByTeam}
                        nextGameweek={nextGameweek}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>
            </section>
        </SidebarContainer>
    );
}

export default TransferUserSidebar;
