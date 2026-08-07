import LeagueControlPage from "../../../src/Components/Pages/Admin/LeagueControlPage";
import { requireLeagueAdmin } from "../../../src/server/auth";

export default async function LeagueControlRoute() {
    await requireLeagueAdmin();
    return <LeagueControlPage />;
}
