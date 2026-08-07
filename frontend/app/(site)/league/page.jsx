import LeaguePage from "../../../src/Components/Pages/LeagueTab/LeaguePage";
import { requireLeagueUser } from "../../../src/server/auth";

export default async function LeagueRoute() {
    await requireLeagueUser();
    return <LeaguePage />;
}
