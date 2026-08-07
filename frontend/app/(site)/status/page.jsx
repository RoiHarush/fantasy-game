import StatusPage from "../../../src/Components/Pages/StatusTab/StatusPage";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import { requireLeagueUser } from "../../../src/server/auth";

export default async function StatusRoute() {
    await requireLeagueUser();
    return (
        <GameweekUpdatingGuard>
            <StatusPage />
        </GameweekUpdatingGuard>
    );
}
