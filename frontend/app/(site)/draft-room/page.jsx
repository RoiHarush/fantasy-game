import DraftRoomPage from "../../../src/Components/Pages/DraftRoomTab/DraftRoomPage";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import { requireLeagueUser } from "../../../src/server/auth";

export default async function DraftRoomRoute() {
    await requireLeagueUser();
    return (
        <GameweekUpdatingGuard>
            <DraftRoomPage />
        </GameweekUpdatingGuard>
    );
}
