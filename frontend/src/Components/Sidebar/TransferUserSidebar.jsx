import SidebarContainer from "../Sidebar/SidebarContainer";
import SelectField from "../../shared/ui/SelectField";
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
    const handleChange = (value) => {
        const newUserId = Number(value);
        onUserChange?.(newUserId);
    };

    return (
        <SidebarContainer>
            <section className="w-full overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel">
                <header className="bg-component-gradient p-4 text-brand-ink">
                    <label className="mb-2 block text-xs font-extrabold uppercase tracking-widest" htmlFor="transfer-team-select">View squad</label>
                    <SelectField
                        id="transfer-team-select"
                        value={currentUserId || ""}
                        onValueChange={handleChange}
                        options={users.map((member) => ({ value: member.id, label: member.name }))}
                        ariaLabel="View squad"
                        className="border-white/55 bg-white/75 font-bold text-brand-ink hover:border-white hover:bg-white/85 focus-visible:ring-white/35"
                    />
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
