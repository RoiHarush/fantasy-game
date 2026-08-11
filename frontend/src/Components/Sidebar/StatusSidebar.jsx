import SidebarContainer from "./SidebarContainer";
import LeagueBlock from "./LeagueBlock";
import TeamOfTheWeekBlock from "./TeamOfTheWeekBlock";

function StatusSidebar({ user, league, preSeason = false, previewDreamTeam }) {
    return (
        <aside className="flex w-full min-w-0 flex-col gap-5">
            <SidebarContainer>
                <LeagueBlock league={league} currentUser={user} />
                {!preSeason && <TeamOfTheWeekBlock previewTeam={previewDreamTeam} />}
            </SidebarContainer>
        </aside>
    );
}

export default StatusSidebar;
