import { notFound } from "next/navigation";

import PointsPage from "../../../../src/Components/Pages/PointsTab/PointsPage";
import GameweekUpdatingGuard from "../../../../src/GameweekUpdatingGuard";
import { requireActiveLeagueUser } from "../../../../src/server/auth";
import { ServerApiError, serverApiRequest } from "../../../../src/server/api";

export default async function PointsUserRoute({ params }) {
    await requireActiveLeagueUser();
    const { userId } = await params;

    if (!/^\d+$/.test(userId)) notFound();

    let displayedUser;
    try {
        displayedUser = await serverApiRequest(`/api/users/${userId}`);
    } catch (error) {
        if (error instanceof ServerApiError && error.status === 404) notFound();
        throw error;
    }

    return (
        <GameweekUpdatingGuard>
            <PointsPage displayedUser={displayedUser} />
        </GameweekUpdatingGuard>
    );
}
