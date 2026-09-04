import TradesPage from "../../../src/Components/Pages/Trades/TradesPage";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import { requireActiveLeagueUser } from "../../../src/server/auth";

export default async function TradesRoute() {
    await requireActiveLeagueUser();
    return (
        <GameweekUpdatingGuard>
            <TradesPage />
        </GameweekUpdatingGuard>
    );
}
