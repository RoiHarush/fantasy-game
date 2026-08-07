import SettingsPage from "../../../src/Components/Pages/SettingsTab/SettingsPage";
import { requireLeagueUser } from "../../../src/server/auth";

export default async function SettingsRoute() {
    await requireLeagueUser();
    return <SettingsPage />;
}
