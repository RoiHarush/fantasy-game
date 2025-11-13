import PageLayout from "../../PageLayout";
import StatusSidebar from "../../Sidebar/StatusSidebar";
import Status from "./Status";

function StatusPage({ user }) {
    return (
        <PageLayout
            left={<Status user={user} />}
        // right={<StatusSidebar user={user} />}
        />
    );
}

export default StatusPage;
