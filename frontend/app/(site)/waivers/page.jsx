"use client";

import { RequireLeague, RequireActiveLeague } from "../../../src/RouteGuards";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import WaiverPlannerPage from "../../../src/Components/Pages/WaiversTab/WaiverPlannerPage";

export default function WaiversRoute() {
    return (
        <RequireLeague>
            <RequireActiveLeague>
                <GameweekUpdatingGuard>
                    <WaiverPlannerPage />
                </GameweekUpdatingGuard>
            </RequireActiveLeague>
        </RequireLeague>
    );
}
