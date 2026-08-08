import LeagueMaintenancePage from "../../../src/Components/Pages/superAdmin/LeagueMaintenancePage";
import { TeamsProvider } from "../../../src/Context/TeamsContext";

export default function AdminLeaguesRoute() {
    return (
        <TeamsProvider>
            <LeagueMaintenancePage />
        </TeamsProvider>
    );
}
