import LivePage from "../../../src/Components/Pages/LiveTab/LivePage";
import { requireActiveLeagueUser } from "../../../src/server/auth";

export const metadata = { title: "Live match centre" };

export default async function LiveRoute() {
    await requireActiveLeagueUser();
    return <LivePage />;
}
