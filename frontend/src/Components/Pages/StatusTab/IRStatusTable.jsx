import { useQuery } from "@tanstack/react-query";
import Style from "../../../Styles/IRStatusTable.module.css";
import { apiRequest } from "../../../services/apiClient";
import { queryKeys } from "../../../lib/query/keys";

function IRStatusTable() {
    const { data: irStatuses = [] } = useQuery({
        queryKey: queryKeys.irStatus,
        queryFn: () => apiRequest("/api/teams/ir-status"),
        staleTime: 30_000,
    });

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
