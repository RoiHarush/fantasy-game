import SidebarContainer from "../Sidebar/SidebarContainer";
import SquadPlayersTable from "./SquadPlayersTable";
import styles from "../../Styles/TransferUserSidebar.module.css";

function TransferUserSidebar({
    users,
    currentUserId,
    onUserChange,
    squad,
    players,
    fixturesByTeam,
    nextGameweek,
    isLoading = false,
    error = null,
}) {
    const handleChange = (e) => {
        const newUserId = Number(e.target.value);
        onUserChange?.(newUserId);
    };

    return (
        <SidebarContainer>
            <div className={styles.sidebarBlock}>
                <div className={styles.header}>
                    <label className={styles.label} htmlFor="transfer-team-select">Change Team</label>
                    <select
                        id="transfer-team-select"
                        value={currentUserId || ""}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.content}>
                    <SquadPlayersTable
                        squad={squad}
                        players={players}
                        fixturesByTeam={fixturesByTeam}
                        nextGameweek={nextGameweek}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>
            </div>
        </SidebarContainer>
    );
}

export default TransferUserSidebar;
