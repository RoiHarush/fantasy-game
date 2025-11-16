import SidebarContainer from "./SidebarContainer";
import PointsSummaryBlock from "./PointsSummaryBlock";
import UserClubBlock from "./UserClubBlock";

function UserSidebar({ user }) {
    return (
        <SidebarContainer>
            <UserClubBlock
                title={user.fantasyTeam}
                logoPath={user.logoPath}
            />
            <PointsSummaryBlock user={user} />
        </SidebarContainer>
    );
}

export default UserSidebar;
