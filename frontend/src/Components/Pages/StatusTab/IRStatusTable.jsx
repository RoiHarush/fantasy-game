import Style from "../../../Styles/IRStatusTable.module.css";
import { useIrStatuses } from "../../../features/status/useStatusData";

function IRStatusTable() {
    const { data: irStatuses = [] } = useIrStatuses();

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
