"use client";

import { RequireLeague, RequireActiveLeague } from "../../../src/RouteGuards";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import PointsPage from "../../../src/Components/Pages/PointsTab/PointsPage";

export default function PointsRoute() {
    return (
        <RequireLeague>
            <RequireActiveLeague>
                <GameweekUpdatingGuard>
                    <PointsPage />
                </GameweekUpdatingGuard>
            </RequireActiveLeague>
        </RequireLeague>
    );
}
