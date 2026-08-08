import SidebarContainer from "./SidebarContainer";
import LeagueBlock from "./LeagueBlock";
import TeamOfTheWeekBlock from "./TeamOfTheWeekBlock";

function StatusSidebar({ user, league, preSeason = false }) {
    return (
        <aside className="flex w-full min-w-0 flex-col gap-5">
            <SidebarContainer>
                <LeagueBlock league={league} currentUser={user} />
                {!preSeason && <TeamOfTheWeekBlock />}
            </SidebarContainer>
        </aside>
    );
}

export default StatusSidebar;
