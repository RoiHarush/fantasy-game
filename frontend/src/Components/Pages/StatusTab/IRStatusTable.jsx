import Style from "../../../Styles/IRStatusTable.module.css";
import { useIrStatuses } from "../../../features/status/useStatusData";

function IRStatusTable() {
    const irStatusesQuery = useIrStatuses();
    const irStatuses = irStatusesQuery.data ?? [];

    return (
        <div className={Style.irStatusSection}>
            <h3>IR Status</h3>

            {irStatusesQuery.isPending && <p role="status">Loading IR status…</p>}
            {irStatusesQuery.error && <p role="alert">IR status is temporarily unavailable.</p>}
            {!irStatusesQuery.isPending && !irStatusesQuery.error && irStatuses.length === 0 && (
                <p>No managers currently have a player in IR.</p>
            )}

            {irStatuses.length > 0 && (
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
            )}

        </div>
    );
}
export default IRStatusTable;
