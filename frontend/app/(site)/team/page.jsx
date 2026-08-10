import TeamProfilePage from "../../../src/Components/Pages/TeamProfile/TeamProfilePage";
import { requireLeagueUser } from "../../../src/server/auth";

export default async function TeamProfileRoute() {
    await requireLeagueUser();
    return <TeamProfilePage />;
}
