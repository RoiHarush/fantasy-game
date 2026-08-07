import PointsPage from "../../../src/Components/Pages/PointsTab/PointsPage";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import { requireActiveLeagueUser } from "../../../src/server/auth";

export default async function PointsRoute() {
    await requireActiveLeagueUser();
    return (
        <GameweekUpdatingGuard>
            <PointsPage />
        </GameweekUpdatingGuard>
    );
}
