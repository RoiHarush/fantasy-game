import PickTeamPage from "../../../src/Components/Pages/PickTeamTab/PickTeamPage";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import { requireActiveLeagueUser } from "../../../src/server/auth";

export default async function PickTeamRoute() {
    await requireActiveLeagueUser();
    return (
        <GameweekUpdatingGuard>
            <PickTeamPage />
        </GameweekUpdatingGuard>
    );
}
