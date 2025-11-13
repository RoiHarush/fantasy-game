import PageLayout from "../../PageLayout";
import PointsSummaryBlock from "../../Sidebar/PointsSummaryBlock";
import SidebarContainer from "../../Sidebar/SidebarContainer";
import LeagueTable from "./LeagueTable";


function LeaguePage({ user }) {
    return (
        <PageLayout
            left={<LeagueTable currentUser={user} />}
            right={
                <SidebarContainer>
                    <PointsSummaryBlock user={user} />
                    {/* בהמשך תוכל להוסיף עוד בלוקים כאן */}
                </SidebarContainer>
            }
        />
    );
}

export default LeaguePage;
