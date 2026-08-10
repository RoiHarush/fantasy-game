import SidebarContainer from "./SidebarContainer";
import PointsSummaryBlock from "./PointsSummaryBlock";
import UserClubBlock from "./UserClubBlock";

function UserSidebar({ user, editable = false }) {
    return (
        <SidebarContainer>
            <UserClubBlock
                title={user.fantasyTeamName}
                logoPath={user.logoPath}
                editable={editable}
            />
            <PointsSummaryBlock user={user} />
        </SidebarContainer>
    );
}

export default UserSidebar;
