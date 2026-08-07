import TransferWindowPage from "../../../src/Components/Pages/TransferWindowTab/TransferWindowPage";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import { requireActiveLeagueUser } from "../../../src/server/auth";

export default async function TransferWindowRoute() {
    await requireActiveLeagueUser();
    return (
        <GameweekUpdatingGuard>
            <TransferWindowPage />
        </GameweekUpdatingGuard>
    );
}
