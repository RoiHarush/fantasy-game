import { useEffect, useState } from "react";
import API_URL from "../../../config";
import Style from "../../../Styles/IRStatusTable.module.css";
import { getAuthHeaders } from "../../../services/authHelper";

function IRStatusTable() {
    const [irStatuses, setIrStatuses] = useState([]);

    useEffect(() => {
        fetch(`${API_URL}/api/teams/ir-status`, {
            headers: getAuthHeaders()
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(data => setIrStatuses(data))
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