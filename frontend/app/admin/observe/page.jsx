import LeagueObserverPage from "../../../src/Components/Pages/superAdmin/LeagueObserverPage";
import { TeamsProvider } from "../../../src/Context/TeamsContext";

export const metadata = { title: "Observe leagues" };

export default function ObserveLeaguesRoute() {
    return (
        <TeamsProvider>
            <LeagueObserverPage />
        </TeamsProvider>
    );
}
