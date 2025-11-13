import { useEffect, useState } from "react";
import SidebarContainer from "../Sidebar/SidebarContainer";
import SquadPlayersTable from "./SquadPlayersTable";
import API_URL from "../../config";
import { useGameweek } from "../../Context/GameweeksContext";
import styles from "../../Styles/TransferUserSidebar.module.css";

function TransferUserSidebar({ users, currentUserId, onUserChange }) {
    const { nextGameweek } = useGameweek();
    const [selectedUserId, setSelectedUserId] = useState(currentUserId);
    const [squad, setSquad] = useState(null);

    useEffect(() => {
        if (!selectedUserId || !nextGameweek) return;
        fetch(`${API_URL}/api/users/${selectedUserId}/squad?gw=${nextGameweek.id}`)
            .then((res) => res.json())
            .then((data) => setSquad(data))
            .catch((err) => console.error("Failed to fetch squad:", err));
    }, [selectedUserId, nextGameweek]);

    const handleChange = (e) => {
        const newUserId = Number(e.target.value);
        setSelectedUserId(newUserId);
        onUserChange?.(newUserId);
    };

    return (
        <SidebarContainer>
            <div className={styles.sidebarBlock}>
                <div className={styles.header}>
                    <label className={styles.label}>Change Team</label>
                    <select
                        value={selectedUserId || ""}
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
