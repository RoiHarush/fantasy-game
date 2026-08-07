import FixturesPage from "../../../src/Components/Pages/FixturesTab/FixturePage";
import { requireLeagueUser } from "../../../src/server/auth";

export default async function FixturesRoute() {
    await requireLeagueUser();
    return <FixturesPage />;
}
