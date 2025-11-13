import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import PickTeam from "./PickTeam";


function PickTeamPage({ user }) {
    return (
        <PageLayout
            left={<PickTeam user={user} />}
            right={<UserSidebar user={user} />}
        />
    );
}

export default PickTeamPage;
