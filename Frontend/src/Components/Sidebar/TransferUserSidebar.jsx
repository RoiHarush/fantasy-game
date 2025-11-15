import SidebarContainer from "../Sidebar/SidebarContainer";
import SquadPlayersTable from "./SquadPlayersTable";
import styles from "../../Styles/TransferUserSidebar.module.css";

function TransferUserSidebar({ users, currentUserId, onUserChange, squad }) {
    const handleChange = (e) => {
        const newUserId = Number(e.target.value);
        onUserChange?.(newUserId);
    };

    return (
        <SidebarContainer>
            <div className={styles.sidebarBlock}>
                <div className={styles.header}>
                    <label className={styles.label}>Change Team</label>
                    <select
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

                {squad && (
                    <div className={styles.content}>
                        <SquadPlayersTable squad={squad} />
                    </div>
                )}
            </div>
        </SidebarContainer>
    );
}

export default TransferUserSidebar;
