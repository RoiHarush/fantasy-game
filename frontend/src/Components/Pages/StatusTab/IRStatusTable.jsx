import { useEffect, useState } from "react";
import Style from "../../../Styles/IRStatusTable.module.css";
import { apiRequest } from "../../../services/apiClient";

function IRStatusTable() {
    const [irStatuses, setIrStatuses] = useState([]);

    useEffect(() => {
        apiRequest("/api/teams/ir-status")
            .then(data => setIrStatuses(data || []))
            .catch(err => console.error("Failed to fetch IR statuses:", err));
    }, []);

    return (
        <div className={Style.irStatusSection}>
            <h3>IR Status</h3>

            <div className={Style.tableWrapper}>
                <table className={Style.irTable}>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Team</th>
                            <th>IR Player</th>
                        </tr>
                    </thead>
                    <tbody>
                        {irStatuses.map((s) => (
                            <tr key={s.userId}>
                                <td>{s.userName}</td>
                                <td>{s.teamName}</td>
                                <td>{s.hasIr ? s.irPlayerName : "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
export default IRStatusTable;