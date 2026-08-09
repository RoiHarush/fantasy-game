import SidebarContainer from "../Sidebar/SidebarContainer";
import SquadPlayersTable from "./SquadPlayersTable";

function UserSquadSidebar({ user, squad, players, fixturesByTeam, nextGameweek }) {
    if (!user || !squad) return null;

    return (
        <SidebarContainer>
            <section className="w-full overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-panel">
                <header className="bg-component-gradient px-4 py-3 text-sm font-extrabold text-brand-ink">
                    <p className="text-[0.62rem] uppercase tracking-widest opacity-70">Your next squad</p>
                    <h2 className="mt-0.5 truncate text-base">{user.fantasyTeamName}</h2>
                </header>
                <div>
                    <SquadPlayersTable
                        squad={squad}
                        players={players}
                        fixturesByTeam={fixturesByTeam}
                        nextGameweek={nextGameweek}
                    />
                </div>
            </section>
        </SidebarContainer>
    );
}

export default UserSquadSidebar;

