import { notFound } from "next/navigation";

import LeagueObserverExperience from "../../../../../src/Components/Pages/superAdmin/LeagueObserverExperience";
import { TeamsProvider } from "../../../../../src/Context/TeamsContext";
import { OBSERVER_SCREENS } from "../../../../../src/features/super-admin/observerModel";
import { requireSuperAdmin } from "../../../../../src/server/auth";

export const metadata = { title: "Read-only league view" };

export default async function ObservedLeagueRoute({ params }) {
    await requireSuperAdmin();
    const { leagueId, managerId, screen } = await params;

    if (!/^\d+$/.test(leagueId) || !/^\d+$/.test(managerId) || !OBSERVER_SCREENS.has(screen)) {
        notFound();
    }

    return (
        <TeamsProvider>
            <LeagueObserverExperience leagueId={leagueId} managerId={managerId} screen={screen} />
        </TeamsProvider>
    );
}
