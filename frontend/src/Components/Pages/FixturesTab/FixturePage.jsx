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
                </SidebarContainer>
            }
        />
    );
}

export default FixturePage;
