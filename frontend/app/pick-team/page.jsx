"use client";

import { RequireLeague, RequireActiveLeague } from "../../src/RouteGuards";
import GameweekUpdatingGuard from "../../src/GameweekUpdatingGuard";
import PickTeamPage from "../../src/Components/Pages/PickTeamTab/PickTeamPage";

export default function PickTeamRoute() {
    return (
        <RequireLeague>
            <RequireActiveLeague>
                <GameweekUpdatingGuard>
                    <PickTeamPage />
                </GameweekUpdatingGuard>
            </RequireActiveLeague>
        </RequireLeague>
    );
}