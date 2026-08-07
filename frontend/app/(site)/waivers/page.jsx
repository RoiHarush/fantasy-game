import WaiverPlannerPage from "../../../src/Components/Pages/WaiversTab/WaiverPlannerPage";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import { requireActiveLeagueUser } from "../../../src/server/auth";

export default async function WaiversRoute() {
    await requireActiveLeagueUser();
    return (
        <GameweekUpdatingGuard>
            <WaiverPlannerPage />
        </GameweekUpdatingGuard>
    );
}
