import PageLayout from "../../PageLayout";
import UserSidebar from "../../Sidebar/UserSidebar";
import Points from "./Points";


function PointsPage({ user }) {
    return (
        <PageLayout
            left={<Points user={user} />}
            right={<UserSidebar user={user} />}
        />
    );
}

export default PointsPage;
