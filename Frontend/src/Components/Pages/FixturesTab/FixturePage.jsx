import PageLayout from "../../PageLayout";
import PointsSummaryBlock from "../../Sidebar/PointsSummaryBlock";
import SidebarContainer from "../../Sidebar/SidebarContainer";
import Fixtures from "./Fixtures";


function FixturePage({ user }) {
    return (
        <PageLayout
            left={<Fixtures />}
            right={
                <SidebarContainer>
                    <PointsSummaryBlock user={user} />
                    {/* בהמשך תוכל להוסיף עוד בלוקים כאן */}
                </SidebarContainer>
            }
        />
    );
}

export default FixturePage;
