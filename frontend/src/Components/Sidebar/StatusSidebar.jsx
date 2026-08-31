import SidebarContainer from "./SidebarContainer";
import LeagueBlock from "./LeagueBlock";
import TeamOfTheWeekBlock from "./TeamOfTheWeekBlock";

function StatusSidebar({ user, league, preSeason = false, previewDreamTeam, getMemberPointsHref, hideLeagueOnMobile = false }) {
    return (
        <aside className="flex w-full min-w-0 flex-col gap-5">
            <SidebarContainer>
                <div className={hideLeagueOnMobile ? "hidden lg:block" : undefined}>
                    <LeagueBlock league={league} currentUser={user} getMemberPointsHref={getMemberPointsHref} />
                </div>
                {!preSeason && <TeamOfTheWeekBlock previewTeam={previewDreamTeam} />}
            </SidebarContainer>
        </aside>
    );
}

export default StatusSidebar;
